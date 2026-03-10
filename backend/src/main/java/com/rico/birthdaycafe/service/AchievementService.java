package com.rico.birthdaycafe.service;

import com.rico.birthdaycafe.entity.Achievement;
import com.rico.birthdaycafe.entity.User;
import com.rico.birthdaycafe.entity.UserAchievement;
import com.rico.birthdaycafe.event.GameCompletedEvent;
import com.rico.birthdaycafe.repository.AchievementRepository;
import com.rico.birthdaycafe.repository.UserAchievementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;

    @EventListener
    @Transactional
    public void handleGameCompletedEvent(GameCompletedEvent event) {
        User user = event.getUser();
        String gameType = event.getGameType();

        // Very basic example logic: unlock an achievement based on the game played.
        String achievementCode = switch (gameType) {
            case "CODY" -> "FIRST_CODY_GAME";
            case "ITABAG" -> "FIRST_ITABAG";
            case "PUZZLE" -> "FIRST_PUZZLE";
            default -> null;
        };

        if (achievementCode != null) {
            awardAchievement(user, achievementCode);
        }
    }

    @Transactional
    public void awardAchievement(User user, String achievementCode) {
        Optional<Achievement> achievementOpt = achievementRepository.findByCode(achievementCode);

        if (achievementOpt.isPresent()) {
            Achievement achievement = achievementOpt.get();
            boolean alreadyUnlocked = userAchievementRepository.existsByUserAndAchievement(user, achievement);

            if (!alreadyUnlocked) {
                UserAchievement userAchievement = UserAchievement.builder()
                        .user(user)
                        .achievement(achievement)
                        .build();
                userAchievementRepository.save(userAchievement);

                // TODO: Possibly publish a notification event to the user (e.g. WebSocket or
                // polling)
            }
        }
    }

    @Transactional(readOnly = true)
    public List<UserAchievement> getUserAchievements(User user) {
        return userAchievementRepository.findByUserOrderByUnlockedAtDesc(user);
    }
}
