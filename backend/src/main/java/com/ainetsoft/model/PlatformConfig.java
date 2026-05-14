package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "platform_configs")
public class PlatformConfig {
    @Id
    private String id;
    
    @Builder.Default
    private double cashbackRate = 0.01; 
    @Builder.Default
    private int maxCoinsPerOrder = 50000; 
    
    @Builder.Default
    private boolean autoPayoutEnabled = false; 
    
    @Builder.Default
    private double commissionRate = 0.01;      
    
    @Builder.Default
    private double flatWithdrawalFee = 3300.0; 
    
    @Builder.Default
    private double minWithdrawalAmount = 50000.0; 
    
    @Builder.Default
    private double autoPayoutMaxLimit = 10000000.0; 
    
    @Builder.Default
    private int maxDailyWithdrawalsPerShop = 1;  
    
    @Builder.Default
    private int escrowWindowDays = 3;           
    
    @Builder.Default
    private double taxWithholdingRate = 0.015;  
    
    private LocalDateTime updatedAt;
}
