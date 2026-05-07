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
    
    @Builder.Default
    private List<String> appliedVoucherIds = new ArrayList<>();
    
    private double voucherDiscountAmount; 
    private int usedCoins; 
    private double coinDiscountAmount; 
    private double finalTotalAmount; 
    
    private User.AddressInfo shippingAddress;
    private String paymentMethod;
    private String status; // PENDING, SHIPPING, RETURNING, RETURNED, COMPLETED, CANCELLED
    
    @Builder.Default
    private boolean isReviewed = false;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private String trackingCode;     
    private String shippingProvider; 
    private String carrierStatus;    

    // ==========================================
    // 🚀 TÍNH NĂNG TRẢ HÀNG / HOÀN TIỀN (Shopee Standard)
    // ==========================================
    @Builder.Default
    private String returnStatus = "NONE"; // NONE, REQUESTED, APPROVED, REJECTED
    
    private String returnReason;      // Lý do trả: Hàng lỗi, Khác mô tả...
    private String returnDescription; // Lời nhắn chi tiết từ người mua
    
    // 🚀 BỔ SUNG: Các trường dữ liệu tài chính và liên hệ khiếu nại
    private double requestedRefundAmount; // Số tiền khách hàng đề xuất hoàn lại (hỗ trợ hoàn một phần)
    private String returnEmail;           // Email nhận thông báo tiến trình giải quyết
    
    @Builder.Default
    private List<String> returnImages = new ArrayList<>(); // Hình ảnh bằng chứng
    
    private LocalDateTime returnDeadline; // Hạn chót để bấm trả hàng (3 ngày sau khi giao)
}