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
    
    /**
     * UPDATED: Allows standard phone formatting symbols during input.
     * The service will validate the core carrier digits.
     */
    @Pattern(regexp = "^[0-9+()\\- ]*$", message = "Số điện thoại chỉ được chứa chữ số và các ký hiệu +, -, ()")
    private String phone;
    
    private String gender;
    private LocalDate birthDate;
    private String avatarUrl;

    private List<User.AddressInfo> addresses;
    private List<User.BankInfo> bankAccounts;
}