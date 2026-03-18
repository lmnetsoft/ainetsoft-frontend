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
@Document(collection = "product_reports")
public class ProductReport {
    @Id
    private String id;
    private String productId;
    private String sellerId;   // Added: To track which shop is being reported
    private String reporterId; // User ID of the person reporting
    private String reason;     // Category (Counterfeit, Prohibited, etc.)
    private String details;    // Text explanation
    
    private List<String> evidenceUrls; // Added: Links to uploaded screenshots/proof

    @Builder.Default
    private String status = "PENDING"; // PENDING, INVESTIGATING, RESOLVED, DISMISSED
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt; // Useful for tracking when Admin took action
}