package com.ainetsoft.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "orders")
public class Order {
    @Id
    private String id;
    private String userId;
    private String sellerId;
    private List<OrderItem> items;
    private double totalAmount;
    private User.AddressInfo shippingAddress;
    private String paymentMethod;
    
    @Builder.Default
    private String status = "PENDING"; 

    // NEW: Review status field to prevent duplicate reviews
    @Builder.Default
    private boolean reviewed = false; 

    private boolean isFlagged; 
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}