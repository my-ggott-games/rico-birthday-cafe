package com.rico.birthdaycafe.config;

import com.rico.birthdaycafe.entity.Achievement;
import com.rico.birthdaycafe.repository.AchievementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AchievementSeeder implements CommandLineRunner {

    private final AchievementRepository achievementRepository;

    @Override
    public void run(String... args) {
        seedAchievement("ASPARAGUS_EXCALIBUR", "Excalibur Asparagus", "Grew an Excalibur Asparagus.", "🌱");
        seedAchievement("ASPARAGUS_SPECIAL", "Special Asparagus", "Grew an Excalibur Asparagus without using any items.", "✨");
    }

    private void seedAchievement(String code, String title, String description, String iconUrl) {
        Optional<Achievement> existing = achievementRepository.findByCode(code);
        if (existing.isEmpty()) {
            Achievement achievement = Achievement.builder()
                    .code(code)
                    .title(title)
                    .description(description)
                    .iconUrl(iconUrl)
                    .build();
            achievementRepository.save(achievement);
            System.out.println("Seeded achievement: " + title);
        }
    }
}
