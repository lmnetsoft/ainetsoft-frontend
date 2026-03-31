package com.ainetsoft.controller;

import com.ainetsoft.dto.SellerApprovalRequest;
import com.ainetsoft.model.FeedbackTemplate;
import com.ainetsoft.model.SystemContent; // 🚀 Added import
import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.List;

/**
 * AdminController - Main Administration Hub.
 * Handles Users, Sellers, Products, Reviews, and Feedback Templates.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Matches ROLE_ADMIN from CustomUserDetailsService
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    /**
     * Helper to get the Admin currently making the request.
     */
    private User getCurrentAdmin() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Phiên làm việc của Admin không tìm thấy"));
    }

    private void validateGlobalAdmin(User admin) {
        if (!"admin@ainetsoft.com".equals(admin.getEmail()) && !admin.isGlobalAdmin()) {
            throw new RuntimeException("Truy cập bị từ chối: Chỉ Quản trị viên Toàn cầu mới có quyền.");
        }
    }

    // --- USER MANAGEMENT & DELEGATION (100% PRESERVED) ---

    @GetMapping("/users/all")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/users/promote/{userId}")
    public ResponseEntity<?> promoteToAdmin(
            @PathVariable String userId,
            @RequestBody Set<String> permissions) {
        User currentAdmin = getCurrentAdmin();
        validateGlobalAdmin(currentAdmin); 
        return ResponseEntity.ok(adminService.promoteToAdmin(userId, permissions, currentAdmin));
    }

    @PostMapping("/users/ban/{userId}")
    public ResponseEntity<?> banUser(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.banUser(userId, getCurrentAdmin()));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }

    // --- SELLER MODERATION (100% PRESERVED) ---

    @GetMapping("/sellers/pending")
    public ResponseEntity<?> getPendingSellers() {
        return ResponseEntity.ok(adminService.getPendingSellers());
    }

    @GetMapping("/sellers/review/{userId}")
    public ResponseEntity<?> getSellerVerificationDetails(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.getSellerVerificationDetails(userId));
    }

    @PostMapping("/sellers/process/{userId}")
    public ResponseEntity<?> processSellerUpgrade(
            @PathVariable String userId, 
            @RequestBody SellerApprovalRequest request) {
        return ResponseEntity.ok(adminService.processSellerApproval(userId, request, getCurrentAdmin()));
    }

    // --- PRODUCT MODERATION (100% PRESERVED) ---

    @GetMapping("/products/pending")
    public ResponseEntity<?> getPendingProducts() {
        return ResponseEntity.ok(adminService.getPendingProducts());
    }

    @PostMapping("/products/approve/{productId}")
    public ResponseEntity<?> approveProduct(@PathVariable String productId) {
        return ResponseEntity.ok(adminService.approveProduct(productId, getCurrentAdmin()));
    }

    @PostMapping("/products/reject/{productId}")
    public ResponseEntity<?> rejectProduct(
            @PathVariable String productId, 
            @RequestParam String reason) {
        return ResponseEntity.ok(adminService.rejectProduct(productId, reason, getCurrentAdmin()));
    }

    // --- REVIEW MODERATION (100% PRESERVED) ---

    @GetMapping("/reviews/all")
    public ResponseEntity<?> getAllReviews() {
        return ResponseEntity.ok(adminService.getAllReviewsForModeration());
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable String reviewId) {
        adminService.deleteReview(reviewId, getCurrentAdmin());
        return ResponseEntity.ok().build();
    }

    // --- QUICK RESPONSE TEMPLATES (100% PRESERVED) ---

    @GetMapping("/feedback-templates")
    public ResponseEntity<List<FeedbackTemplate>> getFeedbackTemplates(@RequestParam String type) {
        return ResponseEntity.ok(adminService.getTemplatesByType(type));
    }

    @PostMapping("/feedback-templates")
    public ResponseEntity<FeedbackTemplate> createTemplate(@RequestBody FeedbackTemplate template) {
        return ResponseEntity.ok(adminService.saveFeedbackTemplate(template, getCurrentAdmin()));
    }

    @DeleteMapping("/feedback-templates/{id}")
    public ResponseEntity<?> deleteTemplate(@PathVariable String id) {
        adminService.deleteFeedbackTemplate(id, getCurrentAdmin());
        return ResponseEntity.ok().build();
    }

    // --- 🚀 NEW: DYNAMIC SYSTEM CONTENT MANAGEMENT ---

    /**
     * Admin endpoint to list all managed legal/content pages.
     */
    @GetMapping("/system-contents")
    public ResponseEntity<List<SystemContent>> getAllSystemContents() {
        return ResponseEntity.ok(adminService.getAllSystemContents());
    }

    /**
     * Admin endpoint to fetch a specific legal page for editing by slug.
     */
    @GetMapping("/system-contents/{slug}")
    public ResponseEntity<SystemContent> getSystemContent(@PathVariable String slug) {
        return ResponseEntity.ok(adminService.getSystemContentBySlug(slug));
    }

    /**
     * Admin endpoint to create or update a legal page (Privacy, Terms, etc.).
     */
    @PostMapping("/system-contents")
    public ResponseEntity<SystemContent> saveSystemContent(@RequestBody SystemContent content) {
        return ResponseEntity.ok(adminService.saveSystemContent(content, getCurrentAdmin()));
    }

    /**
     * Admin endpoint to delete a managed page.
     */
    @DeleteMapping("/system-contents/{id}")
    public ResponseEntity<?> deleteSystemContent(@PathVariable String id) {
        adminService.deleteSystemContent(id, getCurrentAdmin());
        return ResponseEntity.ok().build();
    }
}