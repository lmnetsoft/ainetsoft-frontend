package com.ainetsoft.controller;

import com.ainetsoft.dto.SellerApprovalRequest;
import com.ainetsoft.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Master lock for this entire controller
public class AdminController {

    private final AdminService adminService;

    /**
     * NEW: Provides Master Stats for the Admin Dashboard.
     * GET /api/admin/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getGlobalStats() {
        try {
            return ResponseEntity.ok(adminService.getGlobalStats());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // --- SELLER MANAGEMENT ---

    @GetMapping("/sellers/pending")
    public ResponseEntity<?> getPendingSellers() {
        return ResponseEntity.ok(adminService.getPendingSellers());
    }

    @PostMapping("/sellers/process/{userId}")
    public ResponseEntity<?> processSellerUpgrade(
            @PathVariable String userId, 
            @RequestBody SellerApprovalRequest request) {
        return ResponseEntity.ok(adminService.processSellerApproval(userId, request));
    }

    // --- PRODUCT MANAGEMENT ---

    @GetMapping("/products/pending")
    public ResponseEntity<?> getPendingProducts() {
        return ResponseEntity.ok(adminService.getPendingProducts());
    }

    @PostMapping("/products/approve/{productId}")
    public ResponseEntity<?> approveProduct(@PathVariable String productId) {
        return ResponseEntity.ok(adminService.approveProduct(productId));
    }

    @PostMapping("/products/reject/{productId}")
    public ResponseEntity<?> rejectProduct(
            @PathVariable String productId, 
            @RequestParam String reason) {
        return ResponseEntity.ok(adminService.rejectProduct(productId, reason));
    }
}