package com.rico.birthdaycafe.service;

import com.rico.birthdaycafe.dto.AuthResponse;
import com.rico.birthdaycafe.entity.User;
import com.rico.birthdaycafe.exception.AdminAccessDeniedException;
import com.rico.birthdaycafe.exception.InvalidUidException;
import com.rico.birthdaycafe.repository.UserRepository;
import com.rico.birthdaycafe.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(String uid) {
        if ("chiko_03240324".equals(uid)) {
            throw new InvalidUidException("Invalid UID");
        }

        try {
            // In the UID-only flow, all standard users use the same internal password
            // The UID acts as both the identifier and the proof of access
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(uid, "chiko_password"));

            String jwt = tokenProvider.createToken(authentication.getName());

            return new AuthResponse(200, jwt, "Login successful", authentication.getName());
        } catch (AuthenticationException ex) {
            throw new InvalidUidException("Invalid UID");
        }
    }

    @Transactional
    public AuthResponse issueUid() {
        String issuedUid = "chiko_" + java.util.UUID.randomUUID().toString().substring(0, 8);

        User issuedUser = User.builder()
                .username(issuedUid)
                .passwordHash(passwordEncoder.encode("chiko_password"))
                .role("ROLE_USER")
                .build();

        userRepository.save(issuedUser);

        String jwt = tokenProvider.createToken(issuedUser.getUsername());
        return new AuthResponse(200, jwt, "UID issued successfully", issuedUser.getUsername());
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
                        .passwordHash(passwordEncoder.encode("chiko_password"))
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
