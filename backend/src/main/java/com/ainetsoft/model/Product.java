package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    
    // UPDATED: Now links to Category ID for dynamic filtering
    private String categoryId;
    private String categoryName; 
    
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>(); 
    
    private String videoUrl;
    private String videoThumbnailUrl; 

    private String sellerId;   
    private String shopName;

    // SMART FEATURE: Dynamic Specs (e.g., {"Brand": "Apple", "Color": "Titanium"})
    @Builder.Default
    private Map<String, String> specifications = new HashMap<>();
    
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, ARCHIVED
    
    @Builder.Default
    private double averageRating = 0.0;
    
    @Builder.Default
    private int reviewCount = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}