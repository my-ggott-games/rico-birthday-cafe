package com.rico.birthdaycafe.controller;

import com.rico.birthdaycafe.dto.AsparagusScoreRequest;
import com.rico.birthdaycafe.entity.AsparagusScore;
import com.rico.birthdaycafe.repository.AsparagusScoreRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/asparagus")
public class AsparagusScoreController {

    private final AsparagusScoreRepository repository;

    public AsparagusScoreController(AsparagusScoreRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/score/{uid}")
    public ResponseEntity<Integer> getBestScore(@PathVariable String uid) {
        Optional<AsparagusScore> score = repository.findByUid(uid);
        return score.map(s -> ResponseEntity.ok(s.getBestScore()))
                .orElseGet(() -> ResponseEntity.ok(0));
    }

    @PostMapping("/score")
    public ResponseEntity<Void> updateBestScore(@RequestBody AsparagusScoreRequest request) {
        Optional<AsparagusScore> existing = repository.findByUid(request.getUid());
        if (existing.isPresent()) {
            AsparagusScore score = existing.get();
            if (request.getBestScore() > score.getBestScore()) {
                score.setBestScore(request.getBestScore());
                repository.save(score);
            }
        } else {
            AsparagusScore newScore = new AsparagusScore(request.getUid(), request.getBestScore());
            repository.save(newScore);
        }
        return ResponseEntity.ok().build();
    }
}
