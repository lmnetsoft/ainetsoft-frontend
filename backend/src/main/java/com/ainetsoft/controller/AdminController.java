package com.ainetsoft.controller;

import com.ainetsoft.dto.SellerApprovalRequest;
import com.ainetsoft.model.FeedbackTemplate;
import com.ainetsoft.model.User;
import com.ainetsoft.model.SystemContent; 
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest; 
import org.springframework.data.domain.Pageable;    
import org.springframework.data.domain.Sort;        
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.List;

/**
 * AdminController - Main Administration Hub.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

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

    // --- USER MANAGEMENT ---

    @GetMapping("/users/all")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getAllUsersFiltered(search, role, status, pageable));
    }

    /**
     * 🚀 FIXED: Now calls getUserFullProfile instead of getUserById
     * This ensures the User Detail modal gets decrypted bank accounts.
     */
    @GetMapping("/users/detail/{userId}")
    public ResponseEntity<?> getUserDetails(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.getUserFullProfile(userId));
    }

    @PostMapping("/users/promote/{userId}")
    public ResponseEntity<?> promoteToAdmin(
            @PathVariable String userId,
            @RequestBody Set<String> permissions) {
        User currentAdmin = getCurrentAdmin();
        validateGlobalAdmin(currentAdmin);
        return ResponseEntity.ok(adminService.promoteToAdmin(userId, permissions, currentAdmin));
    }

    @PostMapping("/users/demote/{userId}")
    public ResponseEntity<?> demoteUser(@PathVariable String userId) {
        User currentAdmin = getCurrentAdmin();
        validateGlobalAdmin(currentAdmin); 
        return ResponseEntity.ok(adminService.demoteFromAdmin(userId, currentAdmin));
    }

    @PostMapping("/users/ban/{userId}")
    public ResponseEntity<?> banUser(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.banUser(userId, getCurrentAdmin()));
    }

    @PostMapping("/users/status-toggle/{userId}")
    public ResponseEntity<?> toggleUserStatus(@PathVariable String userId) {
        User currentAdmin = getCurrentAdmin();
        return ResponseEntity.ok(adminService.toggleUserStatus(userId, currentAdmin));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }

    // --- MERCHANT MODERATION ---

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

    @PostMapping("/sellers/revoke/{userId}")
    public ResponseEntity<?> revokeSellerRights(
            @PathVariable String userId, 
            @RequestParam String reason) {
        return ResponseEntity.ok(adminService.revokeSellerStatus(userId, reason, getCurrentAdmin()));
    }

    // --- PRODUCT & REPORT MODERATION ---

    @GetMapping("/products/all")
    public ResponseEntity<?> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getAllProducts(pageable));
    }

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

    @DeleteMapping("/products/{productId}")
    public ResponseEntity<?> deleteProduct(@PathVariable String productId) {
        adminService.deleteProduct(productId, getCurrentAdmin());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reports/batch-resolve")
    public ResponseEntity<?> batchResolveReports(
            @RequestBody List<String> ids, 
            @RequestParam String action) {
        return ResponseEntity.ok(adminService.batchResolveReports(ids, action, getCurrentAdmin()));
    }

    // --- REVIEW MODERATION ---

    @GetMapping("/reviews/all")
    public ResponseEntity<?> getAllReviews() {
        return ResponseEntity.ok(adminService.getAllReviewsForModeration());
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable String reviewId) {
        adminService.deleteReview(reviewId, getCurrentAdmin());
        return ResponseEntity.ok().build();
    }

    // --- QUICK RESPONSE TEMPLATES ---

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

    // --- SYSTEM CONTENT MANAGEMENT ---

    @GetMapping("/system-content/all")
    public ResponseEntity<?> getAllSystemContents() {
        return ResponseEntity.ok(adminService.getAllSystemContents());
    }

    @GetMapping("/system-content/category/{category}")
    public ResponseEntity<?> getSystemContentsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(adminService.getSystemContentsByCategory(category));
    }

    @PostMapping("/system-content")
    public ResponseEntity<?> saveSystemContent(@RequestBody SystemContent content) {
        return ResponseEntity.ok(adminService.saveSystemContent(content, getCurrentAdmin()));
    }

    @DeleteMapping("/system-content/{id}")
    public ResponseEntity<?> deleteSystemContent(@PathVariable String id) {
        adminService.deleteSystemContent(id, getCurrentAdmin());
        return ResponseEntity.ok().build();
    }
}