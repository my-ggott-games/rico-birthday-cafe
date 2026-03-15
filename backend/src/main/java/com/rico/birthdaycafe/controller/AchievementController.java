package com.rico.birthdaycafe.controller;

import com.rico.birthdaycafe.dto.AchievementDto;
import com.rico.birthdaycafe.entity.User;
import com.rico.birthdaycafe.entity.UserAchievement;
import com.rico.birthdaycafe.security.CustomUserDetails;
import com.rico.birthdaycafe.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    /** Returns only the achievements the current user has already earned. */
    @GetMapping("/mine")
    public ResponseEntity<List<AchievementDto>> getMyAchievements(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();

        List<UserAchievement> userAchievements = achievementService.getUserAchievements(user);

        List<AchievementDto> dtos = userAchievements.stream().map(ua -> new AchievementDto(
                ua.getAchievement().getCode(),
                ua.getAchievement().getTitle(),
                ua.getAchievement().getDescription(),
                ua.getAchievement().getIconUrl(),
                ua.getUnlockedAt(),
                true  // earned = true for /mine items
        )).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Returns ALL achievements in the system with an `earned` flag for the
     * current user. Used by the Profile modal to show earned (full colour) and
     * unearned (greyed-out, masked) achievements side-by-side.
     */
    @GetMapping("/all")
    public ResponseEntity<List<AchievementDto>> getAllAchievements(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        return ResponseEntity.ok(achievementService.getAllAchievementsWithStatus(user));
    }

    /**
     * Explicitly awards an achievement by code to the current user.
     * Service layer handles idempotency (ignores if already earned).
     */
    @org.springframework.web.bind.annotation.PostMapping("/award/{code}")
    public ResponseEntity<Boolean> awardAchievement(
            @org.springframework.web.bind.annotation.PathVariable String code,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        boolean awarded = achievementService.awardAchievement(userDetails.getUser(), code);
        return ResponseEntity.ok(awarded);
    }
}
