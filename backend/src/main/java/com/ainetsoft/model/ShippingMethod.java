package com.ainetsoft.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

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
    @Field("active")           // Forces MongoDB to use "active"
    @JsonProperty("active")    // Forces JSON to use "active"
    private boolean active = true;

    @Builder.Default
    @Field("codEnabled")
    @JsonProperty("codEnabled")
    private boolean codEnabled = true;

    /**
     * Explicit getter for 'active' to ensure compatibility with 
     * code or UI searching for 'isActive'.
     */
    @JsonProperty("isActive")
    public boolean isActive() {
        return this.active;
    }

    /**
     * Explicit setter to handle incoming JSON 'isActive' keys
     */
    public void setIsActive(boolean isActive) {
        this.active = isActive;
    }
}