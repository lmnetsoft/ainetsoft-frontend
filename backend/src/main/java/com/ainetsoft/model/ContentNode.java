package com.ainetsoft.model;

import lombok.AllArgsConstructor; // 🚀 Added
import lombok.Builder;        // 🚀 Added
import lombok.Data;
import lombok.NoArgsConstructor;  // 🚀 Added
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "content_nodes") // 🚀 Updated collection name for CMS logic
@Data
@Builder // 🚀 Added to fix DataSeeder errors
@NoArgsConstructor
@AllArgsConstructor
public class ContentNode {
    @Id
    private String id;
    private String title;
    private String slug;         // Links to the HTML content in SystemContent
    private String parentId;     // The key for "Parent-Child" nesting. Null = Root.
    private String type;         // "CATEGORY" (folder) or "ARTICLE" (leaf)
    private int displayOrder;
}