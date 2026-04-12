package com.rico.birthdaycafe.controller;

import com.rico.birthdaycafe.dto.AdventureScoreRequest;
import com.rico.birthdaycafe.entity.AdventureScore;
import com.rico.birthdaycafe.repository.AdventureScoreRepository;
import com.rico.birthdaycafe.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/adventure")
public class AdventureScoreController {

    private final AdventureScoreRepository repository;

    public AdventureScoreController(AdventureScoreRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/score")
    public ResponseEntity<Integer> getBestScore(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String uid = userDetails.getUsername();
        Optional<AdventureScore> score = repository.findByUid(uid);
        return score.map(s -> ResponseEntity.ok(s.getBestScore()))
                .orElseGet(() -> ResponseEntity.ok(0));
    }

    @PostMapping("/score")
    public ResponseEntity<Void> updateBestScore(
            @RequestBody AdventureScoreRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String uid = userDetails.getUsername();
        Optional<AdventureScore> existing = repository.findByUid(uid);
        if (existing.isPresent()) {
            AdventureScore score = existing.get();
            if (request.getBestScore() > score.getBestScore()) {
                score.setBestScore(request.getBestScore());
                repository.save(score);
            }
        } else {
            AdventureScore newScore = new AdventureScore(uid, request.getBestScore());
            repository.save(newScore);
        }
        return ResponseEntity.ok().build();
    }
}
