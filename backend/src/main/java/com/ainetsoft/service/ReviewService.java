package com.ainetsoft.service;

import com.ainetsoft.dto.ReviewRequest;
import com.ainetsoft.model.*;
import com.ainetsoft.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public void submitReview(ReviewRequest request, User currentUser) {
        // 🛠️ FIX: Better error handling for the "orderId" requirement
        if (request.getOrderId() == null || request.getOrderId().contains("AUTO_GENERATED")) {
            throw new RuntimeException("Bạn cần mua sản phẩm này để có thể để lại đánh giá.");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin mua hàng."));

        if (!order.getUserId().equals(currentUser.getId())) {
            throw new RuntimeException("Bạn không có quyền đánh giá đơn hàng này.");
        }

        if (!"COMPLETED".equals(order.getStatus())) {
            throw new RuntimeException("Vui lòng chờ đơn hàng hoàn thành trước khi đánh giá.");
        }

        if (order.isReviewed()) {
            throw new RuntimeException("Sản phẩm này đã được bạn đánh giá rồi.");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Sản phẩm không còn tồn tại."));

        Review review = Review.builder()
                .productId(product.getId())
                .sellerId(product.getSellerId())
                .userId(currentUser.getId())
                .userName(currentUser.getFullName())
                .userAvatar(currentUser.getAvatar())
                .rating(request.getRating())
                .comment(request.getComment())
                .imageUrls(request.getImageUrls())
                .videoUrl(request.getVideoUrl())
                .variantInfo(request.getVariantInfo())
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

    public List<Review> getProductReviews(String productId, Integer rating, Boolean hasImages) {
        if (rating != null) {
            return reviewRepository.findByProductIdAndRatingOrderByCreatedAtDesc(productId, rating);
        }
        if (Boolean.TRUE.equals(hasImages)) {
            return reviewRepository.findByProductIdAndImageUrlsIsNotEmptyOrderByCreatedAtDesc(productId);
        }
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public Map<String, Long> getReviewStats(String productId) {
        try {
            if (productId == null || productId.trim().isEmpty() || "undefined".equals(productId)) {
                return getEmptyStats();
            }

            Map<String, Long> stats = new HashMap<>();
            stats.put("total", reviewRepository.countByProductId(productId));
            stats.put("star5", reviewRepository.countByProductIdAndRating(productId, 5));
            stats.put("star4", reviewRepository.countByProductIdAndRating(productId, 4));
            stats.put("star3", reviewRepository.countByProductIdAndRating(productId, 3));
            stats.put("star2", reviewRepository.countByProductIdAndRating(productId, 2));
            stats.put("star1", reviewRepository.countByProductIdAndRating(productId, 1));
            stats.put("withImages", reviewRepository.countByProductIdAndImageUrlsIsNotEmpty(productId));
            return stats;
        } catch (Exception e) {
            log.warn("Review stats fetch failed for product {}: Returning zero stats.", productId);
            return getEmptyStats();
        }
    }

    private Map<String, Long> getEmptyStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", 0L);
        stats.put("star5", 0L);
        stats.put("star4", 0L);
        stats.put("star3", 0L);
        stats.put("star2", 0L);
        stats.put("star1", 0L);
        stats.put("withImages", 0L);
        return stats;
    }

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