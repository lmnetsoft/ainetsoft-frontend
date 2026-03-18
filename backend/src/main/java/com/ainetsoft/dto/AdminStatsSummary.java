package com.ainetsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsSummary {
    private long totalUsers;
    private long totalSellers;
    private long totalProducts; 
    private long totalOrders;
    private double totalRevenue;
    private long pendingProducts;
    private long pendingSellers;
    
    // 🛠️ FIX: Added this field so the Frontend can see the number of violations
    private long totalReports; 

    private List<Map<String, Object>> revenueHistory; 
}