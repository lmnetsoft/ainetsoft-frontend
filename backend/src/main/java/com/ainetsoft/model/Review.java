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
@Document(collection = "reviews")
public class Review {
    @Id
    private String id;
    private String productId;
    private String sellerId;
    private String userId;
    private String userName;
    private String userAvatar;
    
    private int rating; // 1 to 5 stars
    private String comment;
    private LocalDateTime createdAt;
    
    // For "Shopee-style" verification: Did they actually buy it?
    private String orderId;
    private boolean isVerifiedPurchase;
}