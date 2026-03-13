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
        seedAchievement("THANK_YOU_ALL", "감사합니다!", "엔딩크레딧을 끝까지 봤다.", "🎬");
        seedAchievement("LUCKY_RICO_MOMENT", "대길 (Great Luck)", "오늘의 리코 운세에서 대길을 뽑았다!", "🥠");
        seedAchievement("RICO_DEBUT_DATE", "관리자 권한에 접근한 자", "정답은 리코 데뷔 날짜였습니다~", "👀");
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
