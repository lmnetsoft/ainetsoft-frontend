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
    private String password; 
    private String fullName;
    private String gender;
    private LocalDate birthDate; 
    private String avatarUrl; 

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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressInfo {
        private String receiverName;
        private String phone;        // Standardized from 'phoneNumber'
        private String province;     // Tỉnh / Thành phố
        
        // REMOVED: private String district; (Quận / Huyện)
        
        private String ward;         // Phường / Xã
        private String detail;       // Standardized from 'detailAddress'
        private boolean isDefault;

        // Required for logic in OrderService/Checkout filters
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