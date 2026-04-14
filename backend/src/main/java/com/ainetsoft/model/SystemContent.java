package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed; 
import org.springframework.data.mongodb.core.index.TextIndexed; 
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
    
    @TextIndexed(weight = 3) // 🚀 Priority 1: Title matches are most relevant
    private String title;
    
    @TextIndexed(weight = 1) // 🚀 Priority 2: Searching inside the HTML content
    private String htmlContent;
    
    // 🚀 PHASE 5 APPENDS: Governance Metadata
    @Builder.Default
    private String category = "GENERAL"; // e.g., POLICY, FAQ, ANNOUNCEMENT
    
    @Builder.Default
    private boolean isActive = true;
    
    private String updatedBy; // Email or Name of the Admin who last saved
    
    private LocalDateTime lastUpdated;

    // 🚀 Custom constructor (100% PRESERVED)
    public SystemContent(String slug, String title, String htmlContent) {
        this.slug = slug;
        this.title = title;
        this.htmlContent = htmlContent;
        this.lastUpdated = LocalDateTime.now();
    }
}