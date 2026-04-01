package com.rico.birthdaycafe.controller;

import com.rico.birthdaycafe.dto.AdminAuthRequest;
import com.rico.birthdaycafe.dto.AuthResponse;
import com.rico.birthdaycafe.dto.UidLoginRequest;
import com.rico.birthdaycafe.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody UidLoginRequest request) {
        AuthResponse response = authService.login(request.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/issue-uid")
    public ResponseEntity<AuthResponse> issueUid() {
        AuthResponse response = authService.issueUid();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody AdminAuthRequest request) {
        AuthResponse response = authService.loginAdmin(request.getPasscode());
        return ResponseEntity.ok(response);
    }
}
