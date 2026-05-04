package com.ainetsoft.repository;

import com.ainetsoft.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);
    
    List<Order> findByStatus(String status);
    long countByStatus(String status);
    long count();
    
    // 🚀 ELITE FIX: Query nested items to find the Seller's revenue
    List<Order> findByItemsSellerIdAndStatus(String sellerId, String status);

    // 🚀 BẢN VÁ: Dùng @Query tường minh để Spring Boot không tự động parse tên hàm bị lỗi
    @Query("{ 'userId': ?0, 'items.sellerId': ?1, 'status': { $in: ?2 } }")
    boolean existsByUserIdAndSellerIdAndStatusIn(String userId, String sellerId, Collection<String> statuses);

    @Query("{ 'userId': ?0, 'items.sellerId': ?1 }")
    boolean existsByUserIdAndSellerId(String userId, String sellerId);
}