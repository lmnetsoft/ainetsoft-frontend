package com.ainetsoft.controller;

import com.ainetsoft.model.Product;
import com.ainetsoft.model.ProductReport;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.ProductReportRepository;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.AdminService;
import com.ainetsoft.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminReportController {

    private final ProductReportRepository productReportRepository;
    private final ProductService productService;
    private final AdminService adminService; 
    private final UserRepository userRepository;

    /**
     * HELPER: Gets the currently logged-in Admin object for Audit Logs.
     */
    private User getAuthenticatedAdmin() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    /**
     * GET all reports.
     * UPDATED: 
     * 1. Sorts by CreatedAt (Newest first).
     * 2. Performs User Lookup to resolve the "Người dùng ẩn" issue.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllReports() {
        log.info("Admin fetching enriched product violation reports");
        
        // 🛠️ FIX 2: Sorting - Get all and sort by CreatedAt DESC (Newest on top)
        List<ProductReport> reports = productReportRepository.findAll().stream()
                .sorted(Comparator.comparing(ProductReport::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        
        List<Map<String, Object>> enrichedReports = reports.stream().map(report -> {
            Map<String, Object> map = new HashMap<>();
            
            // 1. PRODUCT LOOKUP
            String prodName = "Sản phẩm không còn tồn tại";
            try {
                Product p = productService.getProductById(report.getProductId());
                if (p != null) prodName = p.getName();
            } catch (Exception e) {
                log.warn("Report {}: Linked product not found", report.getId());
            }

            // 🛠️ FIX 1: REPORTER LOOKUP (Fixes "Người dùng ẩn")
            String reporterDisplayName = "Người dùng ẩn";
            if (report.getReporterName() != null && !report.getReporterName().trim().isEmpty()) {
                reporterDisplayName = report.getReporterName();
            } else if (report.getReporterId() != null) {
                // If name is missing, use the ID to find the real User in the database
                reporterDisplayName = userRepository.findById(report.getReporterId())
                        .map(User::getFullName)
                        .orElse("Người dùng ẩn");
            }

            map.put("id", report.getId());
            map.put("productId", report.getProductId());
            map.put("productName", prodName);
            map.put("reason", report.getReason());
            map.put("details", report.getDetails() != null ? report.getDetails() : "Không có mô tả chi tiết.");
            
            map.put("reporterName", reporterDisplayName); // Now shows real name if available
            map.put("status", report.getStatus());
            map.put("createdAt", report.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(enrichedReports);
    }

    /**
     * POST: Process a report (Xác nhận / Bác bỏ).
     */
    @PostMapping("/{reportId}/process")
    public ResponseEntity<?> processReport(
            @PathVariable String reportId,
            @RequestBody Map<String, String> payload) {
        
        log.info("Admin processing report {} with action: {}", reportId, payload.get("action"));
        
        User currentAdmin = getAuthenticatedAdmin();
        String action = payload.get("action");

        String message = adminService.resolveReport(reportId, action, currentAdmin);

        return ResponseEntity.ok(Map.of(
            "message", message,
            "status", action
        ));
    }

    /**
     * DELETE: Permanent cleanup.
     */
    @DeleteMapping("/{reportId}")
    public ResponseEntity<?> deleteReport(@PathVariable String reportId) {
        log.info("Admin deleting violation report record: {}", reportId);
        
        User currentAdmin = getAuthenticatedAdmin();
        adminService.deleteReport(reportId, currentAdmin);
        
        return ResponseEntity.ok(Map.of("message", "Đã xóa bản ghi báo cáo vi phạm vĩnh viễn."));
    }

    /**
     * PRESERVED: Legacy PatchMapping for specific status updates.
     */
    @PatchMapping("/{reportId}")
    public ResponseEntity<?> handleReport(
            @PathVariable String reportId, 
            @RequestBody Map<String, String> actionData) {
        
        ProductReport report = productReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo!"));

        String status = actionData.get("status"); 
        if (status != null) report.setStatus(status);

        productReportRepository.save(report);
        return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái", "newStatus", report.getStatus()));
    }
}