package com.ainetsoft.controller;

import com.ainetsoft.dto.ReviewRequest;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository; 

    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitReview(
            @RequestParam("productId") String productId,
            @RequestParam("rating") int rating,
            @RequestParam("comment") String comment,
            @RequestParam("orderId") String orderId,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "video", required = false) MultipartFile video) {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để đánh giá"));
        }

        String userEmail = authentication.getName(); 
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người dùng!"));

        try {
            ReviewRequest request = new ReviewRequest();
            request.setProductId(productId);
            request.setRating(rating);
            request.setComment(comment);
            request.setOrderId(orderId);

            reviewService.submitReviewWithMedia(request, images, video, currentUser);
            
            return ResponseEntity.ok(Map.of("message", "Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getProductReviews(
            @PathVariable String productId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Boolean hasImages) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId, rating, hasImages));
    }

    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<?> getReviewStats(@PathVariable String productId) {
        return ResponseEntity.ok(reviewService.getReviewStats(productId));
    }

    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<?> replyToReview(
            @PathVariable String reviewId, 
            @RequestBody Map<String, String> body) {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }

        String userEmail = authentication.getName(); 
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người dùng!"));

        String replyText = body.get("replyText");
        
        try {
            reviewService.addSellerReply(reviewId, replyText, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Đã gửi phản hồi thành công."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}