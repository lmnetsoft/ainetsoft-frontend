package com.ainetsoft.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "orders")
public class Order {
    @Id
    private String id;
    private String userId;
    private String userEmail; 
    private String sellerId;
    private List<OrderItem> items;
    private User.AddressInfo shippingAddress;
    private String paymentMethod;
    
    // 🚀 BỔ SUNG: MARKETING ENGINE FIELDS
    private double totalAmount; // Tổng tiền gốc ban đầu
    private String appliedVoucherId; // ID của Voucher được áp dụng (Nếu có)
    private double voucherDiscountAmount; // Số tiền được giảm từ Voucher
    private double usedCoins; // Số Xu khách hàng dùng
    private double coinDiscountAmount; // Số tiền quy đổi từ Xu (Thường 1 Xu = 1 VNĐ)
    private double finalTotalAmount; // Tổng tiền thanh toán cuối cùng (totalAmount - voucher - coin)
    
    @Builder.Default
    private String status = "PENDING"; 

    @Builder.Default
    private boolean reviewed = false; 

    private boolean isFlagged; 
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}