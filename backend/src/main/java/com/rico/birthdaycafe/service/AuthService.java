package com.rico.birthdaycafe.service;

import com.rico.birthdaycafe.dto.AuthResponse;
import com.rico.birthdaycafe.entity.User;
import com.rico.birthdaycafe.exception.AdminAccessDeniedException;
import com.rico.birthdaycafe.exception.InvalidUidException;
import com.rico.birthdaycafe.repository.UserRepository;
import com.rico.birthdaycafe.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String PIN_REGEX = "^[0-9]{4}$";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse login(String uid, String password) {
        if ("chiko_03240324".equals(uid)) {
            throw new InvalidUidException("Invalid UID");
        }

        User user = userRepository.findByUsername(uid)
                .orElseThrow(() -> new InvalidUidException("Invalid UID"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new InvalidUidException("Invalid UID or password");
        }

        String jwt = tokenProvider.createToken(user.getUsername());
        return new AuthResponse(200, jwt, "Login successful", user.getUsername());
    }

    @Transactional
    public AuthResponse issueUid() {
        String issuedUid = "chiko_" + UUID.randomUUID().toString().substring(0, 8);

        // Create the user with a placeholder password that cannot match any 4-digit PIN.
        // The user must call /register to set their PIN before logging in.
        User issuedUser = User.builder()
                .username(issuedUid)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role("ROLE_USER")
                .build();

        userRepository.save(issuedUser);

        // Return the uid in the username field; token is null — caller must register a PIN first.
        return new AuthResponse(200, null, "UID issued successfully", issuedUser.getUsername());
    }

    @Transactional
    public AuthResponse register(String uid, String password, String confirmPassword) {
        if (!password.matches(PIN_REGEX)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "비밀번호는 숫자 4자리여야 해요.");
        }
        if (!password.equals(confirmPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "비밀번호가 일치하지 않아요.");
        }

        User user = userRepository.findByUsername(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "존재하지 않는 번호표예요."));

        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);

        String jwt = tokenProvider.createToken(user.getUsername());
        return new AuthResponse(200, jwt, "Registration successful", user.getUsername());
    }

    @Value("${app.admin.passcode-hash:}")
    private String adminPasscodeHash;

    @Value("${app.admin.passcode:}")
    private String adminPasscode;

    public AuthResponse loginAdmin(String passcode) {
        String normalizedPasscode = normalizePasscode(passcode);

        if (matchesConfiguredAdminPasscode(normalizedPasscode)) {
            // Ensure the specific admin UID exists in the DB so relationships work
            final String ADMIN_UID = "chiko_03240324";
            if (userRepository.findByUsername(ADMIN_UID).isEmpty()) {
                User adminUser = User.builder()
                        .username(ADMIN_UID)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role("ROLE_ADMIN")
                        .build();
                userRepository.save(adminUser);
            }

            String jwt = tokenProvider.createToken(ADMIN_UID);
            return new AuthResponse(200, jwt, "Welcome, Admin", ADMIN_UID);
        }

        if ("519_2024".equals(normalizedPasscode)) {
            // Return a special message for the easter egg. Code is 200 OK.
            // There's no token since they aren't actually an admin.
            return new AuthResponse(200, null, "easter_egg", null);
        }

        throw new AdminAccessDeniedException("Access denied");
    }

    private boolean matchesConfiguredAdminPasscode(String normalizedPasscode) {
        String normalizedPlainPasscode = normalizePasscode(adminPasscode);
        if (!normalizedPlainPasscode.isBlank() && normalizedPlainPasscode.equals(normalizedPasscode)) {
            return true;
        }

        String configuredHashOrLegacyPlain = adminPasscodeHash == null ? "" : adminPasscodeHash.trim();
        if (configuredHashOrLegacyPlain.isBlank()) {
            return false;
        }

        if (looksLikeBcryptHash(configuredHashOrLegacyPlain)) {
            return passwordEncoder.matches(normalizedPasscode, configuredHashOrLegacyPlain);
        }

        return normalizePasscode(configuredHashOrLegacyPlain).equals(normalizedPasscode);
    }

    private String normalizePasscode(String passcode) {
        return passcode == null
                ? ""
                : passcode.trim().toLowerCase().replace('-', '_');
    }

    private boolean looksLikeBcryptHash(String value) {
        return value.startsWith("$2a$")
                || value.startsWith("$2b$")
                || value.startsWith("$2y$");
    }
}
