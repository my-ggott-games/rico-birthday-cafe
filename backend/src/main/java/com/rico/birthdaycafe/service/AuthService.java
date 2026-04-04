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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

  private static final String PIN_REGEX = "^[0-9]{4}$";
  private static final String UID_REGEX = "^chiko_[0-9a-f]{8}$";
  private static final String ADMIN_UID = "chiko_03240324";

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenProvider tokenProvider;

  public AuthResponse login(String uid, String password) {
    if (ADMIN_UID.equals(uid)) {
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
    String issuedUid = generateUniqueUid();
    String issueToken = tokenProvider.createUidIssueToken(issuedUid);

    // Return issued UID + short-lived proof token. User row is created during
    // /register.
    return new AuthResponse(200, issueToken, "UID issued successfully", issuedUid);
  }

  @Transactional
  public AuthResponse register(String uid, String password, String confirmPassword, String issueToken) {
    if (uid == null || !uid.matches(UID_REGEX) || ADMIN_UID.equals(uid)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "INVALID_UID_FORMAT_OR_RESERVED: uid must match chiko_[0-9a-f]{8} and must not be admin uid");
    }
    if (issueToken == null || issueToken.isBlank() || !tokenProvider.validateUidIssueToken(uid, issueToken)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
          "UID_ISSUE_TOKEN_INVALID_OR_EXPIRED: issueToken is missing, invalid, mismatched, or expired for this uid");
    }

    if (!password.matches(PIN_REGEX)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "PIN_FORMAT_INVALID: password must be exactly 4 numeric digits");
    }
    if (!password.equals(confirmPassword)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "PIN_CONFIRM_MISMATCH: password and confirmPassword do not match");
    }

    if (userRepository.existsByUsername(uid)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
          "UID_ALREADY_REGISTERED_OR_REPLAYED: uid already exists (possible duplicate submit or token replay)");
    }

    User user = User.builder()
        .username(uid)
        .passwordHash(passwordEncoder.encode(password))
        .role("ROLE_USER")
        .build();
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

  private String generateUniqueUid() {
    for (int attempt = 0; attempt < 10; attempt++) {
      String candidate = "chiko_" + UUID.randomUUID().toString().substring(0, 8);
      if (!candidate.equals(ADMIN_UID) && !userRepository.existsByUsername(candidate)) {
        return candidate;
      }
    }

    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
        "번호표 발급 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
  }
}
