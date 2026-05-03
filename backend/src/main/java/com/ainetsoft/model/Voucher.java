package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "vouchers")
public class Voucher {
    @Id
    private String id;
    
    private String code; // Ví dụ: "SUMMER2026"
    private String sellerId; // ID của Shop tạo voucher (null nếu là voucher của sàn)
    private String shopName; 
    
    private String title; // Tên hiển thị: "Giảm 20k cho đơn từ 100k"
    private String description;
    
    private String discountType; // "PERCENTAGE" (Phần trăm) hoặc "FIXED_AMOUNT" (Số tiền cố định)
    private double discountValue; // Ví dụ: 10 (%) hoặc 20000 (VNĐ)
    
    private double minOrderValue; // Đơn tối thiểu để áp dụng
    private double maxDiscountAmount; // Giảm tối đa (Dành cho loại PERCENTAGE)
    
    private int usageLimit; // Tổng số lượt sử dụng tối đa
    private int usedCount; // Số lượt đã sử dụng
    
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    
    private boolean isActive;
    private LocalDateTime createdAt;
}