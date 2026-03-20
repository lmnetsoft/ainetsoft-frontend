package com.ainetsoft.controller;

import com.ainetsoft.model.Product;
import com.ainetsoft.model.ProductReport;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.ProductReportRepository;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;
    private final ProductReportRepository productReportRepository;
    private final UserRepository userRepository; 

    private static final long MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB
    private static final int MAX_IMAGE_COUNT = 5;

    // --- 1. PUBLIC ENDPOINTS ---

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllActiveProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductDetail(@PathVariable String id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    // --- 2. SOCIAL & INTERACTION ENDPOINTS ---

    /**
     * 🛠️ NEW: Toggle Favorite (The Heart Icon)
     * Requirement 4: Persistence fix for the 404 error.
     */
    @PostMapping("/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(@PathVariable String id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized: Vui lòng đăng nhập");
        }
        productService.toggleFavorite(id, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái yêu thích"));
    }

    /**
     * Increment the share count for a product.
     */
    @PostMapping("/{id}/share")
    public ResponseEntity<?> shareProduct(@PathVariable String id) {
        log.info("Product {} shared", id);
        productService.incrementShareCount(id);
        return ResponseEntity.ok(Map.of("message", "Cảm ơn bạn đã chia sẻ sản phẩm này!"));
    }

    /**
     * Submit a formal report ("Tố cáo") against a product/seller.
     */
    @PostMapping("/{id}/report")
    public ResponseEntity<?> reportProduct(
            @PathVariable String id, 
            @RequestBody Map<String, Object> reportData, 
            Principal principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401).body("Bạn cần đăng nhập để thực hiện báo cáo.");
        }

        Product product = productService.getProductById(id);
        if (product == null) {
            return ResponseEntity.status(404).body("Sản phẩm không tồn tại.");
        }

        String reporterName = "Người dùng ẩn";
        User reporter = userRepository.findByIdentifier(principal.getName()).orElse(null);
        if (reporter != null) {
            reporterName = reporter.getFullName();
        }

        ProductReport report = ProductReport.builder()
                .productId(id)
                .productName(product.getName())   
                .sellerId(product.getSellerId())
                .reporterId(reporter != null ? reporter.getId() : principal.getName())
                .reporterName(reporterName)       
                .reason((String) reportData.get("reason"))
                .details((String) reportData.get("details"))
                .evidenceUrls((List<String>) reportData.get("evidenceUrls"))
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        
        productReportRepository.save(report);
        productService.incrementReportCount(id);

        log.warn("User {} reported product {}. Reason: {}", reporterName, id, report.getReason());
        
        return ResponseEntity.ok(Map.of(
            "message", "Báo cáo của bạn đã được gửi. Chúng tôi sẽ tiến hành kiểm tra nội dung này."
        ));
    }

    // --- 3. SELLER ENDPOINTS ---

    @PostMapping(value = "/seller/add", consumes = {"multipart/form-data"})
    public ResponseEntity<Product> createProduct(
            @RequestPart("product") Product product,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "video", required = false) MultipartFile video,
            Principal principal) {
        
        if (principal == null) throw new RuntimeException("Unauthorized");

        if (images != null && images.size() > MAX_IMAGE_COUNT) {
            throw new RuntimeException("Tối đa " + MAX_IMAGE_COUNT + " hình ảnh.");
        }

        if (video != null && !video.isEmpty()) {
            if (video.getSize() > MAX_VIDEO_SIZE) {
                throw new RuntimeException("Dung lượng video phải nhỏ hơn 15MB.");
            }
        }

        return ResponseEntity.ok(productService.createProductWithMedia(principal.getName(), product, images, video));
    }

    @GetMapping("/seller/my-items")
    public ResponseEntity<List<Product>> getMyItems(Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(productService.getProductsBySeller(principal.getName()));
    }

    @PutMapping(value = "/seller/update/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<Product> updateItem(
            @PathVariable String id,
            @RequestPart("product") Product product,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "video", required = false) MultipartFile video,
            Principal principal) {
        
        if (principal == null) throw new RuntimeException("Unauthorized");

        if (images != null && images.size() > MAX_IMAGE_COUNT) {
            throw new RuntimeException("Tối đa " + MAX_IMAGE_COUNT + " hình ảnh.");
        }
        if (video != null && !video.isEmpty() && video.getSize() > MAX_VIDEO_SIZE) {
            throw new RuntimeException("Video phải nhỏ hơn 15MB.");
        }

        return ResponseEntity.ok(productService.updateProductWithMedia(id, principal.getName(), product, images, video));
    }

    @DeleteMapping("/seller/delete/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable String id, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        productService.deleteProduct(id, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Xóa sản phẩm thành công!"));
    }

    @PostMapping("/seller/delete-bulk")
    public ResponseEntity<?> bulkDelete(@RequestBody List<String> ids, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        productService.bulkDeleteProducts(ids, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Đã xóa các sản phẩm thành công!"));
    }
}