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
    private double amount;
    
    // Snapshot of bank info at time of request (for safety)
    private String bankName;
    private String accountNumber;
    private String accountHolder;
    
    private String status; // PENDING, APPROVED, REJECTED, COMPLETED
    private String adminNote;
    
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}