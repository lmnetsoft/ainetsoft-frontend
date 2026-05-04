package com.ainetsoft.dto;

import com.ainetsoft.model.CartItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for synchronizing the shopping cart from the React frontend to MongoDB.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartSyncRequest {
    /**
     * The list of items currently in the user's shopping cart.
     */
    private List<CartItem> items;
    
    // 🚀 BẢN VÁ: Danh sách ID Voucher mà khách đang muốn ÁP DỤNG (Tối đa 3 mã: Sàn, Shop, Freeship)
    private List<String> appliedVoucherIds;
    
    // 🚀 BẢN VÁ: Số lượng AiNetsoft Xu khách muốn DÙNG để trừ tiền
    private int coinsUsed;
}