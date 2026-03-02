package com.ainetsoft.dto;

import com.ainetsoft.model.User;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateProfileRequest {
    private String fullName;
    
    // NEW: Added to allow phone-registered users to set their email later
    private String email; 
    
    private String phone;
    private String gender;
    private LocalDate birthDate;
    private String avatarUrl;

    // Capture dynamic list data for Address
    private List<User.AddressInfo> addresses;

    // Capture dynamic list data for Bank Accounts
    private List<User.BankInfo> bankAccounts;
}