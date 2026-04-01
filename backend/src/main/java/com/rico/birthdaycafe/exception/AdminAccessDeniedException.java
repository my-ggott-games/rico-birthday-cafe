package com.rico.birthdaycafe.exception;

public class AdminAccessDeniedException extends RuntimeException {
    public AdminAccessDeniedException(String message) {
        super(message);
    }
}
