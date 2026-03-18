package com.ainetsoft.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequest {

    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private int rating;

    @NotBlank(message = "Comment cannot be empty")
    private String comment;

    /**
     * Matches the visual proof support (Shopee style)
     */
    private List<String> imageUrls;

    private String videoUrl;

    /**
     * Matches the "Phân loại hàng" (e.g., Size M) shown in your screenshot
     */
    private String variantInfo;
}