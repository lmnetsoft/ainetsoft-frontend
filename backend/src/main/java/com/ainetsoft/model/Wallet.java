package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "wallets")
public class Wallet {
    @Id
    private String id;
    
    private String userId; // Liên kết với bảng User
    
    // 💰 Số dư tiền mặt (Real Money/VNĐ) - Dùng cho việc Rút tiền và Hoàn tiền
    @Builder.Default
    private Double balance = 0.0; 

    // 🚀 BỔ SUNG: Số dư tạm giữ (Đang chờ qua thời gian đối trả)
    @Builder.Default
    private Double escrowBalance = 0.0;
    
    // 🪙 AiNetsoft Xu (Platform Coins)
    @Builder.Default
    private double coinBalance = 0.0; 
    
    // 🎫 Kho Voucher (Lưu ID của các Voucher mà người dùng đã bấm "Lưu")
    @Builder.Default
    private List<String> savedVoucherIds = new ArrayList<>();
    
    // 🛡️ KHIÊN BẢO VỆ: Optimistic Locking chống lỗi Double-Spending (Tiêu tiền 2 lần)
    @Version
    private Long version;
    
    private LocalDateTime updatedAt;
}
