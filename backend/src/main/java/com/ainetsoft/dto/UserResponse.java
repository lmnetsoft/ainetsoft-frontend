package com.ainetsoft.dto;

import com.ainetsoft.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private String id; 
    private String email;
    private String phone;
    private String fullName;
    private String gender;
    private LocalDate birthDate;
    private String avatarUrl;
    private Set<String> roles;
    private boolean isGlobalAdmin;
    private Set<String> permissions;
    private String provider;
    
    // Seller specific
    private String sellerVerification;
    private String rejectionReason;
    private User.ShopProfile shopProfile;
    
    // Identity info for verification
    private User.IdentityInfo identityInfo; 
    
    private List<User.AddressInfo> addresses;
    private List<com.ainetsoft.model.CartItem> cart;

    // --- 🛡️ PENDING UPDATE FIELDS ---
    private boolean hasPendingUpdate;
    private User.ShopProfile pendingShopProfile;
    private List<User.AddressInfo> pendingAddresses;

    /**
     * 🚀 FIXED: Added missing field to resolve "cannot find symbol" error.
     * This allows the AuthService builder to set the draft bank info.
     */
    private User.PendingBank pendingBankAccount; 
}