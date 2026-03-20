package com.ainetsoft.controller;

import com.ainetsoft.dto.ReviewRequest;
import com.ainetsoft.model.User;
import com.ainetsoft.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    public ResponseEntity<?> submitReview(@Valid @RequestBody ReviewRequest request) {
        // 🛠️ FIX: Get user from SecurityContext instead of HttpSession
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để đánh giá"));
        }

        User currentUser = (User) authentication.getPrincipal();

        try {
            reviewService.submitReview(request, currentUser);
            return ResponseEntity.ok(Map.of("message", "Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * GET /api/reviews/product/{productId}
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getProductReviews(
            @PathVariable String productId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Boolean hasImages) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId, rating, hasImages));
    }

    /**
     * GET /api/reviews/product/{productId}/stats
     */
    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<?> getReviewStats(@PathVariable String productId) {
        return ResponseEntity.ok(reviewService.getReviewStats(productId));
    }

    /**
     * POST /api/reviews/{reviewId}/reply
     */
    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<?> replyToReview(
            @PathVariable String reviewId, 
            @RequestBody Map<String, String> body) {
        
        // 🛠️ FIX: Get user from SecurityContext instead of HttpSession
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }

        User currentUser = (User) authentication.getPrincipal();
        String replyText = body.get("replyText");
        
        try {
            reviewService.addSellerReply(reviewId, replyText, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Đã gửi phản hồi thành công."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}