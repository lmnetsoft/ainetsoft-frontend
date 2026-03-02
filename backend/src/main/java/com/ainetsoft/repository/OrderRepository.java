package com.ainetsoft.repository;

import com.ainetsoft.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {

    // --- BUYER QUERIES (For "My Purchase" Tabs) ---

    /**
     * Finds all orders for a specific user, sorted by the most recent first.
     */
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Finds orders by user and status (e.g., PENDING, SHIPPING, COMPLETED).
     */
    List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);


    // --- SELLER QUERIES (For "My Shop" / Seller Dashboard) ---

    /**
     * Finds all orders belonging to a specific seller's ID.
     */
    List<Order> findBySellerIdOrderByCreatedAtDesc(String sellerId);

    /**
     * Advanced: Finds orders containing items from a specific Shop Name.
     * This is useful if you want to filter orders by the shop's public name.
     */
    @Query("{ 'items.shopName' : ?0 }")
    List<Order> findByShopNameInItems(String shopName);


    // --- ADMIN & UTILITY QUERIES ---

    /**
     * Finds a single order by its ID (Admin lookup).
     */
    Optional<Order> findById(String id);

    /**
     * Finds orders by a specific payment method (Admin reporting).
     */
    List<Order> findByPaymentMethod(String paymentMethod);
}