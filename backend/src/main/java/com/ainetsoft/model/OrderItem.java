package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    private String productId;
    private String sellerId; // 🛠️ ADDED: To track revenue per shop
    private String productName;
    private int quantity;
    private double price;
    private String imageUrl;
    private String shopName;
}