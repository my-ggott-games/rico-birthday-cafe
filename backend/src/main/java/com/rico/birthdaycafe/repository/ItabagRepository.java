package com.rico.birthdaycafe.repository;

import com.rico.birthdaycafe.entity.Itabag;
import com.rico.birthdaycafe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItabagRepository extends JpaRepository<Itabag, Long> {
    Optional<Itabag> findByUser(User user);
}
