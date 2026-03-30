package com.ainetsoft.repository;

import com.ainetsoft.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    
    // --- CATEGORY QUERIES ---
    // Standard lookup by ID
    List<Product> findByCategoryId(String categoryId);

    // --- MODERATION & DASHBOARD (Fixes the "Đang tải" issue) ---
    /**
     * Finds products by status (PENDING, APPROVED, REJECTED).
     * Used for the Product Moderation table.
     */
    List<Product> findByStatus(String status);

    /**
     * Optimized count for Dashboard Stats.
     * Prevents the server from hanging by counting directly in the database.
     */
    long countByStatus(String status);

    // --- SELLER MANAGEMENT ---
    List<Product> findBySellerId(String sellerId);

    // --- SEARCH FUNCTIONALITY (New: Essential for Admin/Shop search) ---
    /**
     * Case-insensitive search for product names.
     * Use this for the admin search bar to find specific items quickly.
     */
    @Query("{ 'name': { $regex: ?0, $options: 'i' } }")
    List<Product> findByNameRegex(String name);

    /**
     * Optional: Find all products for a seller with a specific status.
     */
    List<Product> findBySellerIdAndStatus(String sellerId, String status);
}