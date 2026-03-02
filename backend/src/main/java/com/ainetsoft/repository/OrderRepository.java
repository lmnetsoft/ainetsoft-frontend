package com.ainetsoft.repository;

import com.ainetsoft.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {

    /**
     * Finds all orders for a specific user, sorted by the most recent first.
     */
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Finds orders by user and status (for the Shopee-style tabs).
     */
    List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);
}