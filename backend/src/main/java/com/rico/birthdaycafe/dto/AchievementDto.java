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
    private LocalDateTime unlockedAt;
}
