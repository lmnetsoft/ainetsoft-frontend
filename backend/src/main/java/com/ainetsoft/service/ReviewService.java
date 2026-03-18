package com.ainetsoft.service;

import com.ainetsoft.dto.ReviewRequest;
import com.ainetsoft.model.*;
import com.ainetsoft.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    /**
     * Handles logic for submitting a new review.
     * Preserves your original ownership and status validations.
     */
    @Transactional
    public void submitReview(ReviewRequest request, User currentUser) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        if (!order.getUserId().equals(currentUser.getId())) {
            throw new RuntimeException("Bạn không có quyền đánh giá đơn hàng này");
        }

        if (!"COMPLETED".equals(order.getStatus())) {
            throw new RuntimeException("Bạn chỉ có thể đánh giá đơn hàng đã hoàn thành");
        }

        if (order.isReviewed()) {
            throw new RuntimeException("Đơn hàng này đã được đánh giá trước đó");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        // Create the Review document (Added support for Media and Variants)
        Review review = Review.builder()
                .productId(product.getId())
                .sellerId(product.getSellerId())
                .userId(currentUser.getId())
                .userName(currentUser.getFullName())
                .userAvatar(currentUser.getAvatar())
                .rating(request.getRating())
                .comment(request.getComment())
                .imageUrls(request.getImageUrls()) // Added photos support
                .videoUrl(request.getVideoUrl())   // Added video support
                .variantInfo(request.getVariantInfo()) // e.g., "Size M"
                .orderId(order.getId())
                .isVerifiedPurchase(true)
                .createdAt(LocalDateTime.now())
                .build();

        reviewRepository.save(review);

        updateProductRating(product);

        order.setReviewed(true);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    /**
     * UPDATED: Fetches reviews with optional filters for the UI Filter Bar.
     * Matches "Tất Cả", "5 Sao", "Có Hình Ảnh" filters in image_971725.png.
     */
    public List<Review> getProductReviews(String productId, Integer rating, Boolean hasImages) {
        if (rating != null) {
            return reviewRepository.findByProductIdAndRatingOrderByCreatedAtDesc(productId, rating);
        }
        if (Boolean.TRUE.equals(hasImages)) {
            return reviewRepository.findByProductIdAndImageUrlsIsNotEmptyOrderByCreatedAtDesc(productId);
        }
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    /**
     * NEW: Generates the counts for the filter buttons (e.g., "5 Sao (303)").
     */
    public Map<String, Long> getReviewStats(String productId) {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", reviewRepository.countByProductId(productId));
        stats.put("star5", reviewRepository.countByProductIdAndRating(productId, 5));
        stats.put("star4", reviewRepository.countByProductIdAndRating(productId, 4));
        stats.put("star3", reviewRepository.countByProductIdAndRating(productId, 3));
        stats.put("star2", reviewRepository.countByProductIdAndRating(productId, 2));
        stats.put("star1", reviewRepository.countByProductIdAndRating(productId, 1));
        stats.put("withImages", reviewRepository.countByProductIdAndImageUrlsIsNotEmpty(productId));
        return stats;
    }

    /**
     * NEW: Logic for the "Phản Hồi Của Người Bán" section.
     */
    public void addSellerReply(String reviewId, String replyText, String sellerId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Đánh giá không tồn tại"));

        if (!review.getSellerId().equals(sellerId)) {
            throw new RuntimeException("Bạn không phải người bán của sản phẩm này");
        }

        review.setSellerReply(replyText);
        review.setRepliedAt(LocalDateTime.now());
        reviewRepository.save(review);
    }

    private void updateProductRating(Product product) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(product.getId());
        if (reviews.isEmpty()) {
            product.setAverageRating(0.0);
            product.setReviewCount(0);
        } else {
            double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
            product.setAverageRating(Math.round(avg * 10.0) / 10.0);
            product.setReviewCount(reviews.size());
        }
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);
    }
}