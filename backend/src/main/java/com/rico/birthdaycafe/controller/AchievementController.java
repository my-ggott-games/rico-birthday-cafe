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
                ua.getUnlockedAt())).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
