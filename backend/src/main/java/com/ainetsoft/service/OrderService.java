package com.ainetsoft.service;

import com.ainetsoft.model.Order;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.OrderRepository;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    /**
     * Retrieves orders for the authenticated user, filtered by status if provided.
     * @param contactInfo Email, Phone, or ID from the Principal
     * @param status The order status (PENDING, SHIPPING, COMPLETED, CANCELLED, or ALL)
     * @return List of Orders sorted by newest first
     */
    public List<Order> getUserOrders(String contactInfo, String status) {
        // FIX: Change findByEmailOrPhone to findByIdentifier
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy người dùng!"));

        // Handle the "ALL" tab or null status
        if (status == null || status.equalsIgnoreCase("ALL") || status.isBlank()) {
            return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }

        // Fetch orders for a specific category (e.g., "COMPLETED")
        return orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status.toUpperCase());
    }
}