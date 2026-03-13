package com.rico.birthdaycafe.controller;

import com.rico.birthdaycafe.security.CustomUserDetails;
import com.rico.birthdaycafe.service.ItabagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game/itabag")
@RequiredArgsConstructor
public class ItabagController {

    private final ItabagService itabagService;

    @GetMapping("/mine")
    public ResponseEntity<String> getMyItabag(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String layoutData = itabagService.getLayoutData(userDetails.getUser());
        return ResponseEntity.ok(layoutData != null ? layoutData : "[]");
    }

    @PostMapping("/save")
    public ResponseEntity<Void> saveMyItabag(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody String layoutData) {
        itabagService.saveLayoutData(userDetails.getUser(), layoutData);
        return ResponseEntity.ok().build();
    }
}
