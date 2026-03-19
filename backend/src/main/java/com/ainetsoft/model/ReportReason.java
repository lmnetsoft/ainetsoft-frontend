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
@Document(collection = "report_reasons")
public class ReportReason {
    @Id
    private String id;
    private String name;        // e.g., "Sản phẩm giả mạo, hàng nhái"
    private boolean active;     // Toggle visibility for users
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}