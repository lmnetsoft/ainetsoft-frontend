package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    /** * Matches the "Có Hình Ảnh / Video" filter in your screenshot.
     */
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();
    private String videoUrl; 

    /**
     * Matches the "Phân loại hàng" (e.g., Size M) shown in your screenshot.
     */
    private String variantInfo; 

    /**
     * Matches the "Phản Hồi Của Người Bán" section in your screenshot.
     */
    private String sellerReply;
    private LocalDateTime repliedAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private String orderId;
    private boolean isVerifiedPurchase; // "Đã mua hàng" badge
}