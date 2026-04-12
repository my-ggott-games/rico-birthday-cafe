package com.rico.birthdaycafe.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "adventure_scores")
@Getter
@Setter
@NoArgsConstructor
public class AdventureScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String uid;

    @Column(nullable = false)
    private int bestScore;

    public AdventureScore(String uid, int bestScore) {
        this.uid = uid;
        this.bestScore = bestScore;
    }
}
