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
@Document(collection = "product_reports")
public class ProductReport {
    @Id
    private String id;
    private String productId;
    private String reporterId; // ID or Email of the user who reported
    private String reason;     // Chosen from popup reasons
    private String details;    // User's specific text explanation
    
    @Builder.Default
    private String status = "PENDING"; // PENDING, INVESTIGATING, RESOLVED
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}