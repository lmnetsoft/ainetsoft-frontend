package com.ainetsoft.dto;

import com.ainetsoft.model.User;
import jakarta.validation.constraints.Pattern; // Added for validation
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for capturing profile update requests from the frontend.
 * Updated with global phone regulation to prevent invalid text input.
 */
@Data
public class UpdateProfileRequest {
    private String fullName;
    
    // Allows phone-registered users to set or update their email later
    private String email; 
    
    /**
     * REGULATION: Validates global phone formats.
     * Only allows digits (0-9). 
     * Length: 7 to 15 characters (International standard).
     */
    @Pattern(regexp = "^\\d{7,15}$", message = "Số điện thoại phải là chữ số và có độ dài từ 7 đến 15 ký tự.")
    private String phone;
    
    private String gender;
    private LocalDate birthDate;
    private String avatarUrl;

    // Capture dynamic list data for Address (Automatically uses updated User.AddressInfo)
    private List<User.AddressInfo> addresses;

    // Capture dynamic list data for Bank Accounts
    private List<User.BankInfo> bankAccounts;
}