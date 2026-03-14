package com.ainetsoft.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
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
    
    @Indexed(unique = true)
    private String email;
    private String phone;
    private String password; 
    private String fullName;
    private String gender;
    private LocalDate birthDate; 
    private String avatarUrl; 

    public String getAvatar() {
        return this.avatarUrl;
    }

    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;
    private String providerId; 

    @Builder.Default
    private String accountStatus = "ACTIVE"; 

    /**
     * Verification States: 
     * NONE: Default buyer
     * PENDING: User submitted info, waiting for admin
     * REJECTED: Admin denied (check rejectionReason)
     * VERIFIED: Full Seller access
     */
    @Builder.Default
    private String sellerVerification = "NONE"; 
    
    private String rejectionReason;

    // --- START NEW DELEGATION FIELDS ---
    @Builder.Default
    private boolean isGlobalAdmin = false; // admin@ainetsoft.com

    @Builder.Default
    private Set<String> permissions = new HashSet<>(); 
    // --- END NEW DELEGATION FIELDS ---

    private ShopProfile shopProfile;
    
    private IdentityInfo identityInfo; // New field for CCCD verification

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
    public static class ShopProfile {
        private String shopName;
        private String shopDescription;
        private String shopAddress;
        private String shopLogoUrl;
        private String businessEmail;
        private String businessPhone;
        private String taxCode;
        @Builder.Default
        private int lowStockThreshold = 5;
        @Builder.Default
        private boolean holidayMode = false;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IdentityInfo {
        private String cccdNumber;
        private String frontImageUrl; // URL for front of ID
        private String backImageUrl;  // URL for back of ID
        private LocalDateTime submittedAt;
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
        public boolean isDefault() { return isDefault; }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BankInfo {
        private String bankName;
        private String accountNumber;
        private String accountHolder;
        private boolean isDefault;
    }
}