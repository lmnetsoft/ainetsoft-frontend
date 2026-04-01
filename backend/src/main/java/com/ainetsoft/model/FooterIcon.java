package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "footer_icons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FooterIcon {
    @Id
    private String id;
    private String name;       // e.g., "Visa"
    private String imgUrl;     // URL to the icon
    private String category;   // "PAYMENT" or "SHIPPING"
    private int displayOrder;
}