package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "shipping_methods")
public class ShippingMethod {
    @Id
    private String id;
    private String name;           // e.g., "Hỏa Tốc"
    private String description;    // e.g., "Nhận hàng trong 2 giờ"
    private Double baseCost;       // e.g., 208600.0
    private String estimatedTime;  // e.g., "Ngày mai 08:00"
    
    @Builder.Default
    private boolean isActive = true;
}