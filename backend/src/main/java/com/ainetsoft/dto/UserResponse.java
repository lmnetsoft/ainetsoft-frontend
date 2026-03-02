package com.ainetsoft.dto;

import com.ainetsoft.model.User; // Import to access the inner classes
import lombok.*;
import java.time.LocalDate;
import java.util.List; // Import for the dynamic lists
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String email;
    private String phone;
    private String fullName;
    private String gender;
    private LocalDate birthDate;
    private String avatarUrl;
    private Set<String> roles;

    // NEW: Capability to send Address list back to frontend
    private List<User.AddressInfo> addresses;

    // NEW: Capability to send Bank Account list back to frontend
    private List<User.BankInfo> bankAccounts;
}