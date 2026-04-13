package com.rico.birthdaycafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AchievementAwardResponse {
    private boolean awarded;
    private AchievementDto achievement;
}
