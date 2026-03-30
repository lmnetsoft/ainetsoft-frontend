package com.ainetsoft.repository;

import com.ainetsoft.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    
    // --- USER ORDER HISTORY ---
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);
    
    // --- ADMIN DASHBOARD & REVENUE (Fixes the "Đang tải" issue) ---
    /**
     * Fetches only orders with a specific status (e.g., COMPLETED).
     * Used by AdminService to calculate revenue without loading every order in the DB.
     */
    List<Order> findByStatus(String status);

    /**
     * Optimized count for specific order states (e.g., PENDING_PAYMENT).
     */
    long countByStatus(String status);

    /**
     * Total order count for the "Tổng đơn hàng" dashboard card.
     */
    long count();
    
    // --- SELLER DASHBOARD ---
    List<Order> findBySellerIdAndStatus(String sellerId, String status);

    // --- CHAT & PERMISSIONS ---
    /**
     * Checks if a buyer has a valid history with a seller to allow chatting.
     */
    boolean existsByUserIdAndSellerIdAndStatusIn(String userId, String sellerId, Collection<String> statuses);

    /**
     * Simple check to see if any connection exists between buyer and seller.
     */
    boolean existsByUserIdAndSellerId(String userId, String sellerId);
}