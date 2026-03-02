package com.ainetsoft.model;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
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
    private String userId; // Links to the User's _id
    private List<OrderItem> items;
    private double totalAmount;
    private String status; // e.g., "PENDING", "SHIPPING", "COMPLETED", "CANCELLED"
    private String shippingAddress;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class OrderItem {
    private String productId;
    private String productName;
    private int quantity;
    private double price;
    private String imageUrl;
}