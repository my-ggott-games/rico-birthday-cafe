package com.rico.birthdaycafe.repository;

import com.rico.birthdaycafe.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    Optional<Achievement> findByCode(String code);

    Optional<Achievement> findByTitle(String title);
}
