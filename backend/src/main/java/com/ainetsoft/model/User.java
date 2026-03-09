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
    private String password; 
    private String fullName;
    private String gender;
    private LocalDate birthDate; 
    
    // Existing avatar field
    private String avatarUrl; 

    /**
     * FIX: ReviewService.java calls .getAvatar(). 
     * We map it here so the compiler finds it.
     */
    public String getAvatar() {
        return this.avatarUrl;
    }

    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;
    private String providerId; 

    // --- ADMINISTRATIVE STATUS FIELDS ---
    @Builder.Default
    private String accountStatus = "ACTIVE"; // ACTIVE, BANNED

    @Builder.Default
    private String sellerVerification = "NONE"; // NONE, PENDING, VERIFIED, REJECTED

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

    public enum AuthProvider {
        LOCAL, GOOGLE, FACEBOOK
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