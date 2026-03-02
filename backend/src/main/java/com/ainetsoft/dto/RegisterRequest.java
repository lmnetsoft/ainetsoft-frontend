package com.ainetsoft.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    // REMOVED @NotBlank: Let the service check if at least one (email/phone) is present
    @Email(message = "Email không hợp lệ")
    private String email;

    // REMOVED @NotBlank: Allow this to be empty if they register via Email
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự") // Recommendation: 8 chars for security
    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;
}