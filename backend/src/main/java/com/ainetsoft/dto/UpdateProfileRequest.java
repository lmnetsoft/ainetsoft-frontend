package com.ainetsoft.dto;

import com.ainetsoft.model.User;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Email;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateProfileRequest {
    private String fullName;
    
    @Email(message = "Email không đúng định dạng")
    private String email; 
    
    @Pattern(regexp = "^[0-9+()\\- ]*$", message = "Số điện thoại chỉ được chứa chữ số và các ký hiệu +, -, ()")
    private String phone;
    
    // 🚀 NEW: Carry the OTP code for verification
    private String otpCode; 

    private String gender;
    private LocalDate birthDate;
    private String avatarUrl;

    private User.ShopProfile shopProfile;
    private List<User.AddressInfo> addresses;
}