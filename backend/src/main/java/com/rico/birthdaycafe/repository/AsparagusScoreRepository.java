package com.rico.birthdaycafe.repository;

import com.rico.birthdaycafe.entity.AsparagusScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AsparagusScoreRepository extends JpaRepository<AsparagusScore, Long> {
    Optional<AsparagusScore> findByUid(String uid);
}
