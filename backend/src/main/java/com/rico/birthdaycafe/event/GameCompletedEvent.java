package com.rico.birthdaycafe.event;

import com.rico.birthdaycafe.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GameCompletedEvent {
    private final User user;
    private final String gameType; // e.g., "CODY", "ITABAG", "PUZZLE"
}
