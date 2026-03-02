package com.ainetsoft.dto;

import com.ainetsoft.model.User; // Required to reference the inner classes
import lombok.Data;
import java.time.LocalDate;
import java.util.List; // Required for the dynamic lists

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String gender;
    private LocalDate birthDate;
    private String avatarUrl;

    // NEW: Capture dynamic list data for Address
    private List<User.AddressInfo> addresses;

    // NEW: Capture dynamic list data for Bank Accounts
    private List<User.BankInfo> bankAccounts;
}