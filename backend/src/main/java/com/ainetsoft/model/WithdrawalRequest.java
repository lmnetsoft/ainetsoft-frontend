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
    
    @Version
    private Long version;
    
    private String targetType; 
    private String userId;     
    private String sellerId;   
    
    private String shopName;      
    private String sellerFullName; 

    private double amount;     // Số tiền yêu cầu
    private double fee;        // 🚀 MỚI: Phí giao dịch
    private double netAmount;   // 🚀 MỚI: Số tiền thực nhận (Lương thực chi)
    
    private String bankName;
    private String accountNumber;
    private String accountHolder;
    
    private String status; 
    private String adminNote;
    
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}
