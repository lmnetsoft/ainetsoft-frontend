package com.ainetsoft.repository;

import com.ainetsoft.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);
    
    // For Admin Stats and Review logic
    List<Order> findByStatus(String status);
    
    // For Seller specifically
    List<Order> findBySellerIdAndStatus(String sellerId, String status);

    /**
     * CHAT PERMISSION CHECK: 
     * Checks if a buyer has an active or completed order with a specific seller.
     * We use a collection of statuses to exclude "CANCELLED" orders if desired.
     */
    boolean existsByUserIdAndSellerIdAndStatusIn(String userId, String sellerId, Collection<String> statuses);

    /**
     * Simple check to see if any order exists between buyer and seller.
     */
    boolean existsByUserIdAndSellerId(String userId, String sellerId);
}