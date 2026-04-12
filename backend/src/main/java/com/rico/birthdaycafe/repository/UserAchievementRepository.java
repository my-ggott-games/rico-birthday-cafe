package com.rico.birthdaycafe.repository;

import com.rico.birthdaycafe.entity.Achievement;
import com.rico.birthdaycafe.entity.User;
import com.rico.birthdaycafe.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {
    List<UserAchievement> findByUserOrderByUnlockedAtDesc(User user);

    boolean existsByUserAndAchievement(User user, Achievement achievement);

    boolean existsByUserAndAchievement_Code(User user, String code);

    void deleteAllByAchievement(Achievement achievement);
}
