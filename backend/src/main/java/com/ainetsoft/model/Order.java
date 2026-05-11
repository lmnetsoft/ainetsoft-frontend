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
    
    private double totalAmount; 
    
    @Builder.Default
    private List<String> appliedVoucherIds = new ArrayList<>();
    
    private double voucherDiscountAmount; 
    private int usedCoins; 
    private double coinDiscountAmount; 
    
    // 🚀 BỔ SUNG: Lưu số tiền Ví AiNetsoft dùng để cấn trừ (Deduction)
    private double usedWalletBalance; 
    
    private double finalTotalAmount; 
    
    private User.AddressInfo shippingAddress;
    private String paymentMethod;
    private String status; 
    
    @Builder.Default
    private boolean isReviewed = false;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private String trackingCode;     
    private String shippingProvider; 
    private String carrierStatus;    

    // ==========================================
    // TÍNH NĂNG TRẢ HÀNG / HOÀN TIỀN
    // ==========================================
    @Builder.Default
    private String returnStatus = "NONE"; 
    
    private String returnReason;      
    private String returnDescription; 
    
    private double requestedRefundAmount; 
    private String returnEmail;            
    
    @Builder.Default
    private List<String> returnImages = new ArrayList<>(); 
    
    private LocalDateTime returnDeadline; 

    // ==========================================
    // TÍNH NĂNG HỦY ĐƠN
    // ==========================================
    private String cancelReason; 
    private String cancelledBy;  
}
