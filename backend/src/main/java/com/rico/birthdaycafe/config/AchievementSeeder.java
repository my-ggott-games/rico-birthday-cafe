package com.rico.birthdaycafe.config;

import com.rico.birthdaycafe.entity.Achievement;
import com.rico.birthdaycafe.entity.User;
import com.rico.birthdaycafe.repository.AchievementRepository;
import com.rico.birthdaycafe.repository.UserAchievementRepository;
import com.rico.birthdaycafe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AchievementSeeder implements CommandLineRunner {

  private final AchievementRepository achievementRepository;
  private final UserAchievementRepository userAchievementRepository;
  private final UserRepository userRepository;

  @Override
  @Transactional
  public void run(String... args) {
    removeAchievementByTitle("행운과 함께");

    // Asparagus achievements: keep legacy aliases in sync so existing DB rows
    // with old/typo codes are automatically corrected to Korean text.
    seedAchievement("ASPARAGUS_EXCALIBUR", "성검 아스파라거스", "성검 아스파라거스를 키웠다", "TreePine");
    seedAchievement("SPECIAL_ASPARAGUS", "전설의 정원사", "비료 없이 성검 아스파라거스를 키웠다", "Trees");
    seedAchievement("THANK_YOU_ALL", "Who Made This?!", "엔딩 크레딧을 끝까지 봤다", "Clapperboard");
    seedAchievement("FIRST_PUZZLE", "퍼즐 첫 완성", "퍼즐을 완성했다", "Puzzle");
    seedAchievement("R-GEND-HERO", "R전드 용사", "레전드보다 R전드가 좋은거죠?", "Swords");
    seedAchievement("RICO_DEBUT_DATE", "관리자 권한에 접근한 자", "정답은 리코 데뷔 날짜였습니다~", "Eye");
    seedAchievement("WHO_ARE_YOU", "??? 예요.", "내 별은 영원히 너야", "Rose");
    seedAchievement("LOST_IN_THE_WAY", "길을 잃었다~", "어딜 가야 할까~", "FileQuestionMark");
    seedAchievement("CODY_LEGEND_COORDINATOR", "전설의 코디네이터", "특별한 코디 조합을 전부 찾아냈다", "Shirt");
    seedAchievement("SLOGAN_COLLECTOR", "슬로건을 탐낸 자", "카페 소품을 소중히 다뤄주세요!", "Hand");
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

  private void removeAchievementByTitle(String title) {
    achievementRepository.findByTitle(title).ifPresent(achievement -> {
      userAchievementRepository.deleteAllByAchievement(achievement);

      List<User> usersWithActiveAchievement = userRepository.findAll()
          .stream()
          .filter(user -> achievement.getCode().equals(user.getActiveAchievementCode()))
          .collect(Collectors.toList());

      usersWithActiveAchievement.forEach(user -> user.setActiveAchievementCode(null));
      if (!usersWithActiveAchievement.isEmpty()) {
        userRepository.saveAll(usersWithActiveAchievement);
      }

      achievementRepository.delete(achievement);
      System.out.println("Removed legacy achievement: " + title);
    });
  }

}
