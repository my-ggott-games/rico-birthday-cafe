package com.rico.birthdaycafe.repository;

import com.rico.birthdaycafe.entity.AdventureScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdventureScoreRepository extends JpaRepository<AdventureScore, Long> {
    Optional<AdventureScore> findByUid(String uid);
}
