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
        seedAchievement("ASPARAGUS_GAEDENER", "정원사", "성검 아스파라거스를 키웠다", "🌱");
        seedAchievement("ASPARAGUS_GAEDENER", "전설의 정원사", "비료 없이 성검 아스파라거스를 키웠다", "✨");
        seedAchievement("THANK_YOU_ALL", "Who Made This?!", "엔딩 크레딧을 끝까지 봤다", "🎬");
        seedAchievement("LUCKY_RICO_MOMENT", "행운과 함께", "오늘의 리코 운세에서 대길을 뽑았다!", "🥠");
        seedAchievement("FIRST_PUZZLE", "퍼즐 첫 완성", "퍼즐놀이를 처음으로 완성했다!", "🧩");
        seedAchievement("LEGEND-HERO", "레전드 용사", "마왕 토벌을 끝마쳤다.", "⚔️");
        seedAchievement("R-GEND-HERO", "R전드 용사", "레전드보다 R전드가 좋은거죠?", "👑");
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
