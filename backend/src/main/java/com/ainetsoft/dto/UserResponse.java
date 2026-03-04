package com.ainetsoft.dto;

import com.ainetsoft.model.User;
import com.ainetsoft.model.CartItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String provider; // Essential for the Frontend "Read-Only" check

    private List<User.AddressInfo> addresses;
    private List<User.BankInfo> bankAccounts;
    private List<CartItem> cart;
}