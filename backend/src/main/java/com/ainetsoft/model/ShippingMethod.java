// src/main/java/com/ainetsoft/model/ShippingMethod.java
package com.ainetsoft.model;

import com.fasterxml.jackson.annotation.JsonProperty; // Add this import
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
    private String name;
    private String description;
    private Double baseCost;
    private String estimatedTime;
    
    @Builder.Default
    @JsonProperty("isActive") // FORCE the JSON key to match the Frontend exactly
    private boolean isActive = true;
}