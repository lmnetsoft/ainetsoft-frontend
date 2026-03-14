package com.ainetsoft.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "categories")
public class Category {
    @Id
    private String id;
    
    private String name;      // e.g., "Điện Thoại"
    private String slug;      // e.g., "dien-thoai"
    private String iconName;  // e.g., "FaMobileAlt"
    
    @Builder.Default
    private boolean active = true; // Admin can "hide" categories without deleting them
}