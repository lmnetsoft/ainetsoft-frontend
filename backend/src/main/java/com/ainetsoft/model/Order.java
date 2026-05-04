package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
    
    private double totalAmount; // Tổng tiền hàng gốc
    
    // 🚀 BẢN VÁ: Chuyển từ appliedVoucherId sang appliedVoucherIds để lưu danh sách nhiều mã
    @Builder.Default
    private List<String> appliedVoucherIds = new ArrayList<>();
    
    private double voucherDiscountAmount; // Tổng tiền giảm từ các Voucher
    
    private int usedCoins; // Số xu khách hàng đã thực tế sử dụng
    private double coinDiscountAmount; // Tiền giảm tương ứng từ Xu
    
    private double finalTotalAmount; // Tiền cuối cùng khách phải trả
    
    private User.AddressInfo shippingAddress;
    private String paymentMethod;
    private String status; // PENDING, SHIPPING, COMPLETED, CANCELLED
    
    @Builder.Default
    private boolean isReviewed = false;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}