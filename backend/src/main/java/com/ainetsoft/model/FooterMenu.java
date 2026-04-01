package com.ainetsoft.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "footer_menus")
@Data
public class FooterMenu {
    @Id
    private String id;
    private String categoryTitle; 
    private List<MenuItem> items;
    private int displayOrder;

    @Data
    public static class MenuItem {
        private String label;
        private String url;        // This will be the 'Slug' if it's an internal page
        private boolean isInternal; // If true, opens the dynamic sub-page engine
    }
}