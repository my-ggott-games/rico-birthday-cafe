package com.rico.birthdaycafe.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuthRequest {
    @NotBlank(message = "Passcode cannot be blank")
    private String passcode; // e.g., s_e_e_s_t_a_r concatenated
}
