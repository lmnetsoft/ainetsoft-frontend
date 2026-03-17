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
    
    private String categoryId;
    private String categoryName; 
    
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>(); 
    
    private String videoUrl;
    private String videoThumbnailUrl; 

    private String sellerId;   
    private String shopName;

    @Builder.Default
    private Map<String, String> specifications = new HashMap<>();
    
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, ARCHIVED
    
    @Builder.Default
    private double averageRating = 0.0;

    @Builder.Default
    private int favoriteCount = 0;

    @Builder.Default
    private int reviewCount = 0;

    // --- NEW PROFESSIONAL FEATURES [Fully Dynamic] ---

    // 1. Vận chuyển (Shipping Config)
    // Using a List avoids the "Map key contains dots" error and allows full seller customization
    @Builder.Default
    private List<ShippingConfig> shippingOptions = new ArrayList<>();

    // 2. An tâm mua sắm (Buyer Protection)
    @Builder.Default
    private boolean protectionEnabled = true; 
    
    @Builder.Default
    private String protectionPolicy = "AiNetsoft Bảo Đảm: Nhận hàng, hoặc được hoàn tiền.";

    // 3. Social & Interaction Flags
    @Builder.Default
    private boolean allowSharing = true;

    @Builder.Default
    private int totalReports = 0; // Incremented when users click "Tố cáo"

    // --- DYNAMIC HELPER CLASSES ---

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShippingConfig {
        private String methodId;       // Link to the shipping_methods collection
        private String methodName;     // e.g., "Hỏa Tốc", "Nhanh"
        private double cost;           // Seller can input their own price for this product
        private String estimatedTime;  // Seller can type "Ngày mai 08:00", "3-5 ngày", etc.
        private String voucherNote;    // Seller can type "Tặng Voucher 20.000đ..."
    }

    // --- AUDIT FIELDS ---

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}