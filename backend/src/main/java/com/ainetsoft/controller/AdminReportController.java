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

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllReports() {
        log.info("Admin fetching enriched product violation reports");
        List<ProductReport> reports = productReportRepository.findAll();
        
        List<Map<String, Object>> enrichedReports = reports.stream().map(report -> {
            Map<String, Object> map = new HashMap<>();
            String prodName = "Sản phẩm không tồn tại";
            try {
                Product p = productService.getProductById(report.getProductId());
                if (p != null) prodName = p.getName();
            } catch (Exception e) {
                log.warn("Report {}: Product details not found", report.getId());
            }

            map.put("id", report.getId());
            map.put("productId", report.getProductId());
            map.put("productName", prodName);
            map.put("reason", report.getReason());
            map.put("details", report.getDetails() != null ? report.getDetails() : "");
            map.put("reporterName", report.getReporterName() != null ? report.getReporterName() : "Người dùng ẩn");
            map.put("status", report.getStatus());
            map.put("createdAt", report.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(enrichedReports);
    }

    @PostMapping("/{reportId}/process")
    public ResponseEntity<?> processReport(
            @PathVariable String reportId,
            @RequestBody Map<String, String> payload) {
        
        ProductReport report = productReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Báo cáo không tồn tại"));
        
        String action = payload.get("action");
        
        if ("RESOLVED".equals(action)) {
            report.setStatus("RESOLVED");
            try {
                Product product = productService.getProductById(report.getProductId());
                if (product != null) {
                    product.setStatus("BANNED");
                    productService.updateProductStatus(product); // FIX: Using a safer method name
                }
            } catch (Exception e) {
                log.error("Failed to ban product", e);
            }
        } else {
            report.setStatus("DISMISSED");
        }

        productReportRepository.save(report);
        return ResponseEntity.ok(Map.of("message", "Xử lý thành công", "status", report.getStatus()));
    }

    @PatchMapping("/{reportId}")
    public ResponseEntity<?> handleReport(
            @PathVariable String reportId, 
            @RequestBody Map<String, String> actionData) {
        
        ProductReport report = productReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo!"));

        String status = actionData.get("status"); 
        String action = actionData.get("adminAction"); 

        if (status != null) report.setStatus(status);
        
        if ("BAN_PRODUCT".equalsIgnoreCase(action)) {
            try {
                Product product = productService.getProductById(report.getProductId());
                if (product != null) {
                    product.setStatus("REJECTED");
                    productService.updateProductStatus(product); // FIX: Using a safer method name
                }
            } catch (Exception e) {
                log.error("Error banning product", e);
            }
        }

        productReportRepository.save(report);
        return ResponseEntity.ok(Map.of("message", "Đã xử lý", "newStatus", report.getStatus()));
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<?> deleteReport(@PathVariable String reportId) {
        productReportRepository.deleteById(reportId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa."));
    }
}