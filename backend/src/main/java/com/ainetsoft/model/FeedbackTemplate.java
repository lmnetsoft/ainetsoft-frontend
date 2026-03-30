package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "feedback_templates")
public class FeedbackTemplate {
    @Id
    private String id;
    private String title;   // Short name for the Admin button (e.g., "Blurry ID")
    private String content; // The actual professional message sent to the user
    private String type;    // "SELLER_REJECTION" or "PRODUCT_REJECTION"
}