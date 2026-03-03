package com.ainetsoft.dto;

import com.ainetsoft.model.User;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for capturing profile update requests from the frontend.
 * Updated to allow partial updates (fields can be null).
 */
@Data
public class UpdateProfileRequest {
    private String fullName;
    
    private String email; 
    
    /**
     * REGULATION: Validates global phone formats if provided.
     * Only allows digits (0-9). 
     * Length: 7 to 15 characters.
     */
    @Pattern(regexp = "^\\d{7,15}$", message = "Số điện thoại phải là chữ số và có độ dài từ 7 đến 15 ký tự.")
    private String phone;
    
    private String gender;
    private LocalDate birthDate;
    private String avatarUrl;

    // Capture dynamic list data for Address
    private List<User.AddressInfo> addresses;

    // Capture dynamic list data for Bank Accounts
    private List<User.BankInfo> bankAccounts;
}