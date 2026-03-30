package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "system_contents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemContent {
    @Id
    private String id;
    
    // e.g., "privacy", "terms", "regulations", "contact"
    private String slug; 
    
    private String title;
    
    // Stores the raw HTML string for the content
    private String htmlContent;
    
    private LocalDateTime lastUpdated;
}