package com.ainetsoft.repository;

import com.ainetsoft.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);
    
    // ADDED: For Admin Stats and Review logic
    List<Order> findByStatus(String status);
    
    // ADDED: For Seller specifically
    List<Order> findBySellerIdAndStatus(String sellerId, String status);
}