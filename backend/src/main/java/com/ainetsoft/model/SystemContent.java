package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed; 
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
    
    @Indexed(unique = true) 
    private String slug; 
    
    private String title;
    
    private String htmlContent;
    
    private LocalDateTime lastUpdated;

    // 🚀 Custom constructor for the Controller "Blank Template" logic
    public SystemContent(String slug, String title, String htmlContent) {
        this.slug = slug;
        this.title = title;
        this.htmlContent = htmlContent;
        this.lastUpdated = LocalDateTime.now();
    }
}