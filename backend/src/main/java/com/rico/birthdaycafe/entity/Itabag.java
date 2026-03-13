package com.rico.birthdaycafe.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "itabags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Itabag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uuid", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String layoutData;
}
