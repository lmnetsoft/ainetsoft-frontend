package com.ainetsoft.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "help_nodes")
@Data
public class HelpNode {
    @Id
    private String id;
    private String title;
    private String slug;        // Links to the HTML content in SystemContent
    private String parentId;    // The key for "Parent-Child" nesting. Null = Root.
    private String type;        // "CATEGORY" (folder) or "ARTICLE" (leaf)
    private int displayOrder;
}