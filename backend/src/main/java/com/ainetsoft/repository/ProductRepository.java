package com.ainetsoft.repository;

import com.ainetsoft.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    
    // FIX: Rename findByCategory to findByCategoryId to match the model
    List<Product> findByCategoryId(String categoryId);

    // OPTIONAL: Added to allow searching by name (e.g., for search bars)
    List<Product> findByCategoryName(String categoryName);

    List<Product> findByStatus(String status);

    /**
     * NEW: Optimized count for Dashboard Stats.
     * Prevents loading full product objects just to get a number.
     */
    long countByStatus(String status);

    List<Product> findBySellerId(String sellerId);
}