package com.rico.birthdaycafe.controller;

import com.rico.birthdaycafe.dto.AdminAuthRequest;
import com.rico.birthdaycafe.dto.AuthRequest;
import com.rico.birthdaycafe.dto.AuthResponse;
import com.rico.birthdaycafe.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Registration endpoint is disabled for UID-only flow
    /*
     * @PostMapping("/register")
     * ...
     */

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        // We reuse AuthRequest, but only the username (UID) is expected/required
        try {
            AuthResponse response = authService.login(request.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, "Invalid UID", null));
        }
    }

    @PostMapping("/guest")
    public ResponseEntity<?> guestLogin() {
        AuthResponse response = authService.registerGuest();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin")
    public ResponseEntity<?> adminLogin(@Valid @RequestBody AdminAuthRequest request) {
        try {
            AuthResponse response = authService.loginAdmin(request.getPasscode());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new AuthResponse(null, "Access denied", null));
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(request.getRemoteAddr())) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
