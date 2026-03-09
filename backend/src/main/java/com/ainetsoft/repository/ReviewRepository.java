package com.ainetsoft.repository;

import com.ainetsoft.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByProductIdOrderByCreatedAtDesc(String productId);
    List<Review> findBySellerId(String sellerId);
    
    // Check if a user has already reviewed this specific order
    boolean existsByUserIdAndOrderId(String userId, String orderId);
    
    // Used for the Stats Engine to calculate totals
    long countByProductId(String productId);
    long countBySellerId(String sellerId);
}