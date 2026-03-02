package com.ainetsoft.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList; // Added for initialization
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {
    @Id
    private String id;
    
    // Auth & Identity
    private String email;
    private String phone;
    private String password; 
    private String fullName;

    // Profile Fields for "Tài khoản của tôi"
    private String gender; // Store as "male", "female", or "other"
    private LocalDate birthDate; 
    
    // Capability to store the user's photo (Base64 or URL)
    private String avatarUrl; 

    // --- NEW: THE SHOPPING CART FIELD ---
    @Builder.Default
    private List<CartItem> cart = new ArrayList<>();

    // Dynamic Embedded Address List
    private List<AddressInfo> addresses;

    // Dynamic Embedded Bank Account List
    private List<BankInfo> bankAccounts;

    @Builder.Default
    private boolean enabled = true;

    private Set<String> roles;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    /**
     * Helper class for Address information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressInfo {
        private String province;
        private String district;
        private String ward;
        private String detail;
        private boolean isDefault;
    }

    /**
     * Helper class for Bank Account information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BankInfo {
        private String bankName;
        private String accountNumber;
        private String accountHolder;
    }
}