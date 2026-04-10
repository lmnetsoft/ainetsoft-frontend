package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
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
    private String sellerId;
    
    // 🚀 NEW: Snapshots for Admin readability
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