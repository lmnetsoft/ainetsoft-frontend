package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "withdrawal_requests")
public class WithdrawalRequest {
    @Id
    private String id;
    
    // 🚀 BẢO MẬT GIAO DỊCH: Ngăn chặn 2 Admin cùng duyệt 1 phiếu cùng lúc
    @Version
    private Long version;
    
    // 🚀 PHÂN LOẠI REQUEST: Hỗ trợ cả Seller và Buyer
    private String targetType; // "SELLER" hoặc "BUYER"
    private String userId;     // Dành cho Buyer
    private String sellerId;   // Dành cho Seller
    
    // Snapshots for Admin readability
    private String shopName;      
    private String sellerFullName; 

    private double amount;
    
    private String bankName;
    private String accountNumber;
    private String accountHolder;
    
    private String status; // PENDING, COMPLETED, REJECTED
    private String adminNote;
    
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}
