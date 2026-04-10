package com.rico.birthdaycafe.controller;

import com.rico.birthdaycafe.entity.User;
import com.rico.birthdaycafe.repository.UserRepository;
import com.rico.birthdaycafe.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/adventure")
public class AdventureStageController {

    private final UserRepository userRepository;

    public AdventureStageController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/stage")
    public ResponseEntity<Integer> getStage(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Optional<User> user = userRepository.findByUsername(userDetails.getUsername());
        return user.map(u -> ResponseEntity.ok(u.getAdventureStage()))
                .orElseGet(() -> ResponseEntity.ok(0));
    }

    @PostMapping("/stage")
    public ResponseEntity<Void> updateStage(
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer newStage = body.get("stage");
        if (newStage == null || newStage < 1) {
            return ResponseEntity.badRequest().build();
        }

        Optional<User> optUser = userRepository.findByUsername(userDetails.getUsername());
        if (optUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = optUser.get();
        if (newStage > user.getAdventureStage()) {
            user.setAdventureStage(newStage);
            userRepository.save(user);
        }
        return ResponseEntity.ok().build();
    }
}
