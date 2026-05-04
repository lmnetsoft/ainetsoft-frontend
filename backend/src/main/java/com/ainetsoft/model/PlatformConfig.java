package com.ainetsoft.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "platform_configs")
public class PlatformConfig {
    @Id
    private String id;
    private double cashbackRate = 0.01; 
    private int maxCoinsPerOrder = 50000; 
    private LocalDateTime updatedAt;
}