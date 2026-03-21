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
    
    @Indexed(unique = true, sparse = true)
    private String email;

    @Indexed(unique = true, sparse = true)
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
    private Set<String> favoriteProductIds = new HashSet<>();

    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;
    private String providerId; 

    @Builder.Default
    private String accountStatus = "ACTIVE"; 

    @Builder.Default
    private String sellerVerification = "NONE"; 
    
    private String rejectionReason;

    @Builder.Default
    private boolean isGlobalAdmin = false; 

    @Builder.Default
    private Set<String> permissions = new HashSet<>(); 

    private ShopProfile shopProfile;
    
    private IdentityInfo identityInfo; 

    @Builder.Default
    private List<CartItem> cart = new ArrayList<>();

    // Support for multiple stock addresses (Địa chỉ lấy hàng)
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
        private String shopAddress; // Main display address derived from default stock
        private String shopLogoUrl;
        private String businessEmail; 
        private String businessPhone; 
        private String taxCode;
        
        /**
         * 2026 Dynamic Shipping Requirement:
         * Stores the list of IDs from the ShippingMethod collection 
         * that this seller has toggled ON.
         */
        @Builder.Default
        private List<String> enabledShippingMethodIds = new ArrayList<>();

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
        private String frontImageUrl; 
        private String backImageUrl;  
        private LocalDateTime submittedAt;
    }

    /**
     * Updated hierarchy for 2026 Map
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressInfo {
        private String receiverName;
        private String phone;
        private String province; // Tỉnh/Thành phố (2026 Map)
        private String ward;     // Phường/Xã
        private String hamlet;   // Ấp/Thôn/Tổ dân phố
        private String detail;   // Số nhà, tên đường
        private boolean isDefault;
        private String latitude;  // GPS Latitude
        private String longitude; // GPS Longitude

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