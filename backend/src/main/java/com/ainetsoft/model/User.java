package com.ainetsoft.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
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
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Số điện thoại phải bao gồm mã vùng (ví dụ: +84)")
    private String phone;

    private String password; 
    private String fullName;
    private String gender;

    @Past(message = "Ngày sinh không hợp lệ")
    private LocalDate birthDate; 

    private String avatarUrl; 

    @Builder.Default
    private boolean emailVerified = false; 
    
    @Indexed(unique = true, sparse = true)
    private String verificationToken;      

    private LocalDateTime verificationTokenExpiry;

    @Builder.Default
    private List<String> tags = new ArrayList<>();
    
    private String chatNote;

    public boolean isOldEnough() {
        if (this.birthDate == null) return false;
        return Period.between(this.birthDate, LocalDate.now()).getYears() >= 16;
    }

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
    
    @Builder.Default
    private List<AddressInfo> addresses = new ArrayList<>();

    private ShopProfile pendingShopProfile;
    
    @Builder.Default
    private List<AddressInfo> pendingAddresses = new ArrayList<>();

    private PendingBank pendingBankAccount;

    @Builder.Default
    private boolean hasPendingUpdate = false;

    private IdentityInfo identityInfo; 

    @Builder.Default
    private List<CartItem> cart = new ArrayList<>();

    // 🚀 BẢN VÁ: VÍ VOUCHER - Lưu ID của các mã mà khách đã bấm "Lưu"
    @Builder.Default
    private Set<String> savedVoucherIds = new HashSet<>();

    // 🚀 BẢN VÁ: VÍ XU - Lưu số dư AiNetsoft Xu của khách hàng
    @Builder.Default
    private int coinBalance = 0;

    @Builder.Default
    private boolean enabled = false;

    @Builder.Default
    private Set<String> roles = new HashSet<>();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    public boolean isAccountLocked() {
        return "BANNED".equalsIgnoreCase(this.accountStatus);
    }

    public boolean isLoginAllowed() {
        return this.enabled && !isAccountLocked();
    }

    public enum AuthProvider {
        LOCAL, GOOGLE, FACEBOOK
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShopProfile {
        private String shopName;
        @Indexed(unique = true, sparse = true)
        private String shopSlug;              
        private LocalDateTime lastShopNameChange; 
        private String shopDescription;
        private String shopAddress; 
        private String shopLogoUrl;
        private String businessEmail; 
        private String businessPhone; 
        private String businessType;      
        private String companyName;       
        private String registeredAddress; 
        @Builder.Default
        private List<String> invoiceEmails = new ArrayList<>(); 
        private String taxCode;           
        private String businessLicenseUrl; 
        
        // 🚀 SHIPPING SETTINGS
        @Builder.Default
        private List<String> enabledShippingMethodIds = new ArrayList<>();
        @Builder.Default
        private List<String> customShippingMethods = new ArrayList<>(); 
        private LocalDateTime expressPausedUntil; 
        
        // 🚀 NEW: Thermal Printing Config
        @Builder.Default
        private boolean thermalPrintingEnabled = false;
        
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
        private String identityType; 
        private String cccdNumber;   
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
    public static class PendingBank {
        private String bankName;
        private String accountHolder;
        private String accountNumber;
    }
}
