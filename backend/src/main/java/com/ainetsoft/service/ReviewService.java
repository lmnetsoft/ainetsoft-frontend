package com.ainetsoft.service;

import com.ainetsoft.dto.ReviewRequest;
import com.ainetsoft.model.*;
import com.ainetsoft.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    /**
     * Handles the logic for submitting a new review.
     * Validates that the order is completed and hasn't been reviewed yet.
     */
    @Transactional
    public void submitReview(ReviewRequest request, User currentUser) {
        // 1. Validation: Does the order exist?
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        // 2. Ownership: Does this order belong to the current user?
        if (!order.getUserId().equals(currentUser.getId())) {
            throw new RuntimeException("Bạn không có quyền đánh giá đơn hàng này");
        }

        // 3. Status: Is the order completed? (Shopee logic: Only delivered items can be rated)
        if (!"COMPLETED".equals(order.getStatus())) {
            throw new RuntimeException("Bạn chỉ có thể đánh giá đơn hàng đã hoàn thành");
        }

        // 4. Duplicate Check: Has this order already been reviewed?
        if (order.isReviewed()) {
            throw new RuntimeException("Đơn hàng này đã được đánh giá trước đó");
        }

        // 5. Product Check: Does the product exist?
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        // 6. Create and Save the Review document
        Review review = Review.builder()
                .productId(product.getId())
                .sellerId(product.getSellerId())
                .userId(currentUser.getId())
                .userName(currentUser.getFullName())
                .userAvatar(currentUser.getAvatar()) // Assuming User model has avatar field
                .rating(request.getRating())
                .comment(request.getComment())
                .orderId(order.getId())
                .isVerifiedPurchase(true)
                .createdAt(LocalDateTime.now())
                .build();

        reviewRepository.save(review);

        // 7. Re-calculate the Product's overall rating stats
        updateProductRating(product);

        // 8. Update Order state to prevent double-reviewing
        order.setReviewed(true);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    /**
     * Fetches all reviews for a specific product.
     */
    public List<Review> getProductReviews(String productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    /**
     * Internal method to calculate average rating and update the Product document.
     * This ensures the home page doesn't have to calculate averages on the fly.
     */
    private void updateProductRating(Product product) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(product.getId());
        
        if (reviews.isEmpty()) {
            product.setAverageRating(0.0);
            product.setReviewCount(0);
        } else {
            double avg = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);

            // Round to 1 decimal place (e.g., 4.7)
            product.setAverageRating(Math.round(avg * 10.0) / 10.0);
            product.setReviewCount(reviews.size());
        }

        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);
    }
}