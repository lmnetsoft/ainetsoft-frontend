package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@Document(collection = "footer_menus")
@Data
@Builder // 🚀 Added
@NoArgsConstructor // 🚀 Added
@AllArgsConstructor // 🚀 Added
public class FooterMenu {
    @Id
    private String id;
    private String categoryTitle; 
    private List<MenuItem> items;
    private int displayOrder;

    @Data
    @Builder // 🚀 Added
    @NoArgsConstructor // 🚀 Added
    @AllArgsConstructor // 🚀 Added
    public static class MenuItem {
        private String label;
        private String url; 
        
        @JsonProperty("isInternal") 
        private boolean isInternal; 
    }
}