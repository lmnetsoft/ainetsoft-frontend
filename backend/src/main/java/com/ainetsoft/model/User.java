package com.ainetsoft.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Core User model representing the 'users' collection in MongoDB.
 * Updated to support OAuth2 Social Login providers.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {
    @Id
    private String id;
    
    private String email;
    private String phone;
    private String password; // Will be null for social users
    private String fullName;
    private String gender;
    private LocalDate birthDate; 
    private String avatarUrl; 

    // NEW: Fields to track how the user authenticated
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL; // Default for standard registration
    private String providerId; // Unique ID from Google/Facebook

    @Builder.Default
    private List<CartItem> cart = new ArrayList<>();

    @Builder.Default
    private List<AddressInfo> addresses = new ArrayList<>();

    @Builder.Default
    private List<BankInfo> bankAccounts = new ArrayList<>();

    @Builder.Default
    private boolean enabled = true;

    private Set<String> roles;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    /**
     * Enum to identify the source of the user account.
     */
    public enum AuthProvider {
        LOCAL,   // Registered via Phone/Email + Password
        GOOGLE,  // Logged in via Google
        FACEBOOK // Logged in via Facebook
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressInfo {
        private String receiverName;
        private String phone;
        private String province; 
        private String ward;
        private String detail;
        private boolean isDefault;

        public boolean isDefault() {
            return isDefault;
        }
    }

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