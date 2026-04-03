package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder; // 🚀 Added
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "footer_icons")
@Data
@Builder // 🚀 Added to support the DataSeeder
@NoArgsConstructor
@AllArgsConstructor
public class FooterIcon {
    @Id
    private String id;
    private String name;       // e.g., "Visa"
    private String imgUrl;     // URL to the icon
    private String category;   // "PAYMENT" or "SHIPPING"
    private int displayOrder;
    private boolean active;    // Added based on our Phase 4 logic
}