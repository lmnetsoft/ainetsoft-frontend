package com.ainetsoft.repository;

import com.ainetsoft.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {
    // Basic listing
    List<Review> findByProductIdOrderByCreatedAtDesc(String productId);
    List<Review> findBySellerId(String sellerId);
    
    // --- UI FILTER SUPPORT (Matches image_971725.png) ---
    
    // Filter by specific star rating (1, 2, 3, 4, 5)
    List<Review> findByProductIdAndRatingOrderByCreatedAtDesc(String productId, int rating);
    
    // Get count for each star level (to show on filter buttons)
    long countByProductIdAndRating(String productId, int rating);

    // Filter reviews that have images (Matches "Có Hình Ảnh / Video" filter)
    List<Review> findByProductIdAndImageUrlsIsNotEmptyOrderByCreatedAtDesc(String productId);
    
    // Count for the "Có Hình Ảnh" filter button
    long countByProductIdAndImageUrlsIsNotEmpty(String productId);

    // --- LOGIC CHECKS ---

    // Check if a user has already reviewed this specific order
    boolean existsByUserIdAndOrderId(String userId, String orderId);
    
    // Used for the Stats Engine to calculate totals
    long countByProductId(String productId);
    long countBySellerId(String sellerId);
}