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
    private long totalProducts; // ADDED THIS LINE TO FIX COMPILATION
    private long totalOrders;
    private double totalRevenue;
    private long pendingProducts;
    private long pendingSellers;
    private List<Map<String, Object>> revenueHistory; 
}