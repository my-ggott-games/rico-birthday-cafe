package com.rico.birthdaycafe.service;

import com.rico.birthdaycafe.dto.AuthRequest;
import com.rico.birthdaycafe.dto.AuthResponse;
import com.rico.birthdaycafe.entity.User;
import com.rico.birthdaycafe.repository.UserRepository;
import com.rico.birthdaycafe.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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
    private final RateLimiterService rateLimiterService;

    // Registration based on IP address is no longer used in the UID-only flow.
    // The guest endpoint handles all new user creation.

    public AuthResponse login(String uid) {
        // In the UID-only flow, all standard users use the same internal password
        // The UID acts as both the identifier and the proof of access
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(uid, "chiko_password"));

        String jwt = tokenProvider.createToken(authentication.getName());

        return new AuthResponse(jwt, "Login successful", authentication.getName());
    }

    @Transactional
    public AuthResponse registerGuest() {
        String guestUsername = "chiko_" + java.util.UUID.randomUUID().toString().substring(0, 8);

        User guestUser = User.builder()
                .username(guestUsername)
                .passwordHash(passwordEncoder.encode("chiko_password")) // Not meant to be logged into directly
                .role("ROLE_GUEST")
                .build();

        userRepository.save(guestUser);
        String jwt = tokenProvider.createToken(guestUser.getUsername());

        return new AuthResponse(jwt, "Guest login successful", guestUser.getUsername());
    }

    @org.springframework.beans.factory.annotation.Value("${app.admin.passcode-hash}")
    private String adminPasscodeHash;

    public AuthResponse loginAdmin(String passcode) {
        // Simple secure check against Bcrypt Hash from configuration
        // verified using PasswordEncoder.matches

        if (passwordEncoder.matches(passcode, adminPasscodeHash)) {
            String jwt = tokenProvider.createToken("admin_ricocafe"); // Create an overarching admin token
            return new AuthResponse(jwt, "Welcome, Admin", "admin_ricocafe");
        }
        throw new RuntimeException("Invalid admin passcode");
    }
}
