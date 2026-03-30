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

    // --- 🚀 NEW: EMAIL VERIFICATION FLOW ---
    @Builder.Default
    private boolean emailVerified = false; // Prevents "Fake" accounts from accessing Seller features
    
    private String verificationToken;      // Token sent via Azure email link
    // ---------------------------------------

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
    private String sellerVerification = "NONE"; // NONE, PENDING, APPROVED, REJECTED
    
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

    @Builder.Default
    private Set<String> roles = new HashSet<>();

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

        // --- NEW: NICE URL & COOLDOWN LOGIC ---
        @Indexed(unique = true, sparse = true)
        private String shopSlug;              // URL-friendly name (e.g., thanh-nguyen)
        private LocalDateTime lastShopNameChange; // Tracks the 30-day constraint
        
        private String shopDescription;
        private String shopAddress; 
        private String shopLogoUrl;
        private String businessEmail; 
        private String businessPhone; 
        
        // --- Updated for Step 3: Business & Tax Information ---
        private String businessType;      // INDIVIDUAL, HOUSEHOLD, ENTERPRISE
        private String companyName;       // Tên công ty / Hộ kinh doanh
        private String registeredAddress; // Địa chỉ đăng ký kinh doanh
        
        @Builder.Default
        private List<String> invoiceEmails = new ArrayList<>(); // Support multiple emails (up to 5)
        
        private String taxCode;           // Mã số thuế
        private String businessLicenseUrl; // URL for the uploaded business license image
        
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
        private String identityType; // CCCD or PASSPORT
        private String cccdNumber;   // Stores the 12-digit ID or Passport number
        private String frontImageUrl; 
        private String backImageUrl;  
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
        private String hamlet;   
        private String detail;   
        private boolean isDefault;
        private String latitude;  
        private String longitude; 

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