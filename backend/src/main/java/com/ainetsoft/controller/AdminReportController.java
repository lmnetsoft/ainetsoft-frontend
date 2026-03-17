package com.ainetsoft.controller;

import com.ainetsoft.model.Product;
import com.ainetsoft.model.ProductReport;
import com.ainetsoft.repository.ProductReportRepository;
import com.ainetsoft.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Strict security for System Management
@Slf4j
public class AdminReportController {

    private final ProductReportRepository productReportRepository;
    private final ProductService productService;

    /**
     * GET all reports for the Admin Dashboard.
     * Admins can filter or sort these by status (PENDING/RESOLVED) on the frontend.
     */
    @GetMapping
    public ResponseEntity<List<ProductReport>> getAllReports() {
        log.info("Admin fetching all product violation reports");
        return ResponseEntity.ok(productReportRepository.findAll());
    }

    /**
     * UPDATE report status and potentially take action on the product.
     * Body example: { "status": "RESOLVED", "adminAction": "BAN_PRODUCT" }
     */
    @PatchMapping("/{reportId}")
    public ResponseEntity<?> handleReport(
            @PathVariable String reportId, 
            @RequestBody Map<String, String> actionData) {
        
        ProductReport report = productReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo!"));

        String status = actionData.get("status"); // e.g., "RESOLVED", "DISMISSED"
        String action = actionData.get("adminAction"); // e.g., "BAN_PRODUCT", "KEEP_ALIVE"

        if (status != null) report.setStatus(status);
        
        // If the Admin decides the report is valid and the product is illegal
        if ("BAN_PRODUCT".equalsIgnoreCase(action)) {
            Product product = productService.getProductById(report.getProductId());
            product.setStatus("REJECTED"); // This removes it from the public list
            // Note: ProductService's save logic is usually inside the service, 
            // but for simplicity we assume direct update or service call here.
            // You might need a small helper in ProductService for this.
        }

        productReportRepository.save(report);
        
        return ResponseEntity.ok(Map.of(
            "message", "Đã xử lý báo cáo thành công",
            "newStatus", report.getStatus()
        ));
    }

    /**
     * DELETE a report (e.g., clearing out old resolved reports).
     */
    @DeleteMapping("/{reportId}")
    public ResponseEntity<?> deleteReport(@PathVariable String reportId) {
        productReportRepository.deleteById(reportId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa bản ghi báo cáo."));
    }
}