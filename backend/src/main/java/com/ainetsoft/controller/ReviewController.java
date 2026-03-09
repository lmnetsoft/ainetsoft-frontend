package com.ainetsoft.controller;

import com.ainetsoft.dto.ReviewRequest;
import com.ainetsoft.model.User;
import com.ainetsoft.service.ReviewService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * POST /api/reviews/submit
     * Allows a buyer to submit a review for a completed order item.
     */
    @PostMapping("/submit")
    public ResponseEntity<?> submitReview(@Valid @RequestBody ReviewRequest request, HttpSession session) {
        User currentUser = (User) session.getAttribute("user");
        
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để đánh giá"));
        }

        try {
            reviewService.submitReview(request, currentUser);
            return ResponseEntity.ok(Map.of("message", "Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * GET /api/reviews/product/{productId}
     * Public endpoint to fetch all reviews for a specific product.
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getProductReviews(@PathVariable String productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }
}