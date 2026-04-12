package com.rico.birthdaycafe.exception;

import com.rico.birthdaycafe.controller.AuthController;
import com.rico.birthdaycafe.dto.AuthResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice(assignableTypes = AuthController.class)
public class AuthExceptionAdvice {

    @ExceptionHandler(InvalidUidException.class)
    public ResponseEntity<AuthResponse> handleInvalidUid(InvalidUidException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthResponse(401, null, ex.getMessage(), null));
    }

    @ExceptionHandler(AdminAccessDeniedException.class)
    public ResponseEntity<AuthResponse> handleAdminAccessDenied(AdminAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new AuthResponse(403, null, ex.getMessage(), null));
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            HttpMessageNotReadableException.class
    })
    public ResponseEntity<AuthResponse> handleInvalidAuthRequest(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new AuthResponse(400, null, "Invalid auth request", null));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<AuthResponse> handleAuthStatusError(ResponseStatusException ex) {
        int statusCode = ex.getStatusCode().value();
        String message = ex.getReason() == null ? ex.getMessage() : ex.getReason();

        return ResponseEntity.status(ex.getStatusCode())
                .body(new AuthResponse(statusCode, null, message, null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<AuthResponse> handleUnexpectedAuthError(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new AuthResponse(500, null, "Auth server error", null));
    }
}
