package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "products")
public class Product {
    @Id
    private String id;
    private String name;
    private String description;
    private double price;
    private int stock;
    private List<String> images; 
    private String category;
    
    private String sellerId;   
    private String shopName;
    
    // UPDATED: Standard is PENDING for review
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, ARCHIVED
    
    // NEW: Rating fields to support ReviewService and Stats Engine
    @Builder.Default
    private double averageRating = 0.0;
    
    @Builder.Default
    private int reviewCount = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}