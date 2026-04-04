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
    // Asparagus achievements: keep legacy aliases in sync so existing DB rows
    // with old/typo codes are automatically corrected to Korean text.
    seedAchievement("ASPARAGUS_EXCALIBUR", "성검 아스파라거스", "성검 아스파라거스를 키웠다", "TreePine");
    seedAchievement("SPECIAL_ASPARAGUS", "전설의 정원사", "비료 없이 성검 아스파라거스를 키웠다", "Trees");
    seedAchievement("THANK_YOU_ALL", "Who Made This?!", "엔딩 크레딧을 끝까지 봤다", "Clapperboard");
    seedAchievement("LUCKY_RICO_MOMENT", "행운과 함께", "오늘의 운세에서 대길을 뽑았다", "ScrollText");
    seedAchievement("FIRST_PUZZLE", "퍼즐 첫 완성", "퍼즐을 완성했다", "Puzzle");
    seedAchievement("LEGEND-HERO", "레전드 용사", "용사 리코 이야기를 해금했다", "Sword");
    seedAchievement("R-GEND-HERO", "R전드 용사", "레전드보다 R전드가 좋은거죠?", "Swords");
    seedAchievement("RICO_DEBUT_DATE", "관리자 권한에 접근한 자", "정답은 리코 데뷔 날짜였습니다~", "Eye");
    seedAchievement("WHO_ARE_YOU", "??? 예요.", "내 별은 영원히 너야", "Rose");
    seedAchievement("LOST_IN_THE_WAY", "길을 잃었다~", "어딜 가야 할까~", "FileQuestionMark");

    // One-time normalization for legacy English asparagus titles regardless of
    // code.
    normalizeLegacyEnglishAsparagusTitles();
  }

  private void seedAchievement(String code, String title, String description, String iconUrl) {
    Optional<Achievement> existing = achievementRepository.findByCode(code);
    if (existing.isPresent()) {
      Achievement achievement = existing.get();
      boolean updated = false;

      if (!title.equals(achievement.getTitle())) {
        achievement.setTitle(title);
        updated = true;
      }

      if (!description.equals(achievement.getDescription())) {
        achievement.setDescription(description);
        updated = true;
      }

      if (!iconUrl.equals(achievement.getIconUrl())) {
        achievement.setIconUrl(iconUrl);
        updated = true;
      }

      if (updated) {
        achievementRepository.save(achievement);
        System.out.println("Updated achievement seed: " + title);
      }
      return;
    }

    Achievement achievement = Achievement.builder()
        .code(code)
        .title(title)
        .description(description)
        .iconUrl(iconUrl)
        .build();
    achievementRepository.save(achievement);
    System.out.println("Seeded achievement: " + title);
  }

  private void normalizeLegacyEnglishAsparagusTitles() {
    for (Achievement achievement : achievementRepository.findAll()) {
      String title = achievement.getTitle();
      if (title == null) {
        continue;
      }

      boolean updated = false;
      if ("Excalibur Asparagus".equals(title)) {
        achievement.setTitle("성검 아스파라거스");
        achievement.setDescription("성검 아스파라거스를 키웠다");
        achievement.setIconUrl("Sword");
        updated = true;
      } else if ("Special Asparagus".equals(title)) {
        achievement.setTitle("전설의 정원사");
        achievement.setDescription("아이템 없이 성검 아스파라거스를 키웠다");
        achievement.setIconUrl("Sparkles");
        updated = true;
      }

      if (updated) {
        achievementRepository.save(achievement);
        System.out.println("Normalized legacy achievement title: " + title);
      }
    }
  }
}
