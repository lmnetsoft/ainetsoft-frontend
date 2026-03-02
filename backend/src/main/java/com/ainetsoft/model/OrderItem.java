package com.ainetsoft.model;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    private String productId;
    private String productName;
    private int quantity;
    private double price;
    private String imageUrl;
    private String shopName;
}