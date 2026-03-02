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
}