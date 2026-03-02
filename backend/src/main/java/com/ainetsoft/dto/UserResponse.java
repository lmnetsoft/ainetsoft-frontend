package com.ainetsoft.dto;

import com.ainetsoft.model.User;
import com.ainetsoft.model.CartItem; // NEW: Required for the shopping cart items
import lombok.*;
import java.time.LocalDate;
import java.util.List;
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

    // NEW: Capability to send the shopping cart items back to frontend
    private List<CartItem> cart;
}