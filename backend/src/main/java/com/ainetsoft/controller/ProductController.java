package com.ainetsoft.controller;

import com.ainetsoft.model.Product;
import com.ainetsoft.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;

    private static final long MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB
    private static final int MAX_IMAGE_COUNT = 5;

    // --- PUBLIC ENDPOINTS ---

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllActiveProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductDetail(@PathVariable String id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    // --- SELLER ENDPOINTS ---

    @PostMapping(value = "/seller/add", consumes = {"multipart/form-data"})
    public ResponseEntity<Product> createProduct(
            @RequestPart("product") Product product,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "video", required = false) MultipartFile video,
            Principal principal) {
        
        if (principal == null) throw new RuntimeException("Bạn cần đăng nhập để thực hiện thao tác này");

        if (images != null && images.size() > MAX_IMAGE_COUNT) {
            throw new RuntimeException("Bạn chỉ được phép tải lên tối đa " + MAX_IMAGE_COUNT + " hình ảnh.");
        }

        if (video != null && !video.isEmpty()) {
            if (video.getSize() > MAX_VIDEO_SIZE) {
                throw new RuntimeException("Dung lượng video phải nhỏ hơn 15MB.");
            }
        }

        log.info("Seller {} adding product {}", principal.getName(), product.getName());
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

    /**
     * DELETE SINGLE: Deletes one product and its physical files.
     */
    @DeleteMapping("/seller/delete/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable String id, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        productService.deleteProduct(id, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Xóa sản phẩm thành công!"));
    }

    /**
     * NEW: BULK DELETE: Deletes multiple selected products and their physical files.
     */
    @PostMapping("/seller/delete-bulk")
    public ResponseEntity<?> bulkDelete(@RequestBody List<String> ids, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        productService.bulkDeleteProducts(ids, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Đã xóa các sản phẩm được chọn thành công!"));
    }
}