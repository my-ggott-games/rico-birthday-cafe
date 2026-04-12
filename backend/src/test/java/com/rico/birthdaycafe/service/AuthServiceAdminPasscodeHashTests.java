package com.rico.birthdaycafe.service;

import com.rico.birthdaycafe.dto.AuthResponse;
import com.rico.birthdaycafe.exception.AdminAccessDeniedException;
import com.rico.birthdaycafe.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "app.admin.passcode=",
        "app.admin.passcode-hash=$2y$10$VPiKhqcvf7SWXd1oCV2qSe7utOCjIuYZt6W5JBYfHm0igVdTJDyt2"
})
@Transactional
class AuthServiceAdminPasscodeHashTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void adminLoginAcceptsConfiguredBcryptHash() {
        AuthResponse response = authService.loginAdmin("sample_secret");

        assertThat(response.getCode()).isEqualTo(200);
        assertThat(response.getToken()).isNotBlank();
        assertThat(response.getUsername()).isEqualTo("chiko_03240324");
        assertThat(userRepository.findByUsername("chiko_03240324")).isPresent();
    }

    @Test
    void adminLoginRejectsIncorrectPasscodeWhenHashConfigured() {
        assertThatThrownBy(() -> authService.loginAdmin("sample_wrong"))
                .isInstanceOf(AdminAccessDeniedException.class);
    }
}
