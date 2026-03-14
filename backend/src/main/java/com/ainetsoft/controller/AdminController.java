package com.ainetsoft.controller;

import com.ainetsoft.dto.SellerApprovalRequest;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Master lock for all admin routes
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    /**
     * Helper to get the Admin currently making the request from the Security Context.
     */
    private User getCurrentAdmin() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Phiên làm việc của Admin không tìm thấy"));
    }

    /**
     * Ensures only the root admin (admin@ainetsoft.com) can perform critical actions 
     * like promoting other admins or banning users.
     */
    private void validateGlobalAdmin(User admin) {
        if (!"admin@ainetsoft.com".equals(admin.getEmail()) && !admin.isGlobalAdmin()) {
            throw new RuntimeException("Truy cập bị từ chối: Chỉ Quản trị viên Toàn cầu mới có quyền thực hiện.");
        }
    }

    /**
     * GET /api/admin/summary
     * Fetches statistics for the Dashboard (Revenue, Users, etc.)
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getGlobalStats() {
        return ResponseEntity.ok(adminService.getGlobalStats());
    }

    // --- USER MANAGEMENT & DELEGATION ---

    @GetMapping("/users/all")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    /**
     * Promote a user to Admin and assign specific permissions.
     * Restricted to the Master Admin account.
     */
    @PostMapping("/users/promote/{userId}")
    public ResponseEntity<?> promoteToAdmin(
            @PathVariable String userId,
            @RequestBody Set<String> permissions) {
        User currentAdmin = getCurrentAdmin();
        validateGlobalAdmin(currentAdmin); 
        return ResponseEntity.ok(adminService.promoteToAdmin(userId, permissions, currentAdmin));
    }

    /**
     * POST /api/admin/users/ban/{userId}
     * Completely blocks a user from the platform.
     */
    @PostMapping("/users/ban/{userId}")
    public ResponseEntity<?> banUser(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.banUser(userId, getCurrentAdmin()));
    }

    /**
     * GET /api/admin/audit-logs
     * Returns a history of all administrative actions.
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }

    // --- SELLER MODERATION ---

    /**
     * GET /api/admin/sellers/pending
     * Lists all users currently in the PENDING_SELLER state.
     */
    @GetMapping("/sellers/pending")
    public ResponseEntity<?> getPendingSellers() {
        return ResponseEntity.ok(adminService.getPendingSellers());
    }

    /**
     * GET /api/admin/sellers/review/{userId}
     * Fetches full identity data (CCCD images, Bank Info) for the review modal.
     */
    @GetMapping("/sellers/review/{userId}")
    public ResponseEntity<?> getSellerVerificationDetails(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.getSellerVerificationDetails(userId));
    }

    /**
     * POST /api/admin/sellers/process/{userId}
     * Approves or Rejects a seller registration.
     */
    @PostMapping("/sellers/process/{userId}")
    public ResponseEntity<?> processSellerUpgrade(
            @PathVariable String userId, 
            @RequestBody SellerApprovalRequest request) {
        return ResponseEntity.ok(adminService.processSellerApproval(userId, request, getCurrentAdmin()));
    }

    // --- PRODUCT MODERATION ---

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
}