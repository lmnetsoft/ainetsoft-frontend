package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String userId;      // Recipient
    private String title;       // e.g., "Đơn hàng đã được giao"
    private String message;     // e.g., "Đơn hàng #12345 đang trên đường đến bạn."
    private String type;        // ORDER, SYSTEM, PROMOTION, SELLER_APPROVAL
    private String relatedId;   // e.g., orderId or productId for navigation
    
    @Builder.Default
    private boolean isRead = false;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}