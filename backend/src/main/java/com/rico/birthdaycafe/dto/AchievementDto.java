package com.rico.birthdaycafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AchievementDto {
    private String code;
    private String title;
    private String description;
    private String iconUrl;
    /** When this achievement was unlocked; null if not yet earned. */
    private LocalDateTime unlockedAt;
    /** True if the authenticated user has earned this achievement. */
    private boolean earned;
}

