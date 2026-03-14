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

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;

    // Constants for your business rules
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

    /**
     * UPDATED: Create Product with Media Upload
     * We use @RequestPart to handle the Product data (JSON) and Files (Multipart) together.
     */
    @PostMapping(value = "/seller/add", consumes = {"multipart/form-data"})
    public ResponseEntity<Product> createProduct(
            @RequestPart("product") Product product,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "video", required = false) MultipartFile video,
            Principal principal) {
        
        if (principal == null) throw new RuntimeException("Bạn cần đăng nhập để thực hiện thao tác này");

        // 1. Validate Image Count (Max 5)
        if (images != null && images.size() > MAX_IMAGE_COUNT) {
            throw new RuntimeException("Bạn chỉ được phép tải lên tối đa " + MAX_IMAGE_COUNT + " hình ảnh.");
        }

        // 2. Validate Video Size (< 15MB)
        if (video != null && !video.isEmpty()) {
            if (video.getSize() > MAX_VIDEO_SIZE) {
                throw new RuntimeException("Dung lượng video phải nhỏ hơn 15MB.");
            }
        }

        log.info("Seller {} adding product {} with {} images", principal.getName(), product.getName(), (images != null ? images.size() : 0));
        
        return ResponseEntity.ok(productService.createProductWithMedia(principal.getName(), product, images, video));
    }

    @GetMapping("/seller/my-items")
    public ResponseEntity<List<Product>> getMyItems(Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(productService.getProductsBySeller(principal.getName()));
    }

    /**
     * UPDATED: Update Product with optional new Media
     */
    @PutMapping(value = "/seller/update/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<Product> updateItem(
            @PathVariable String id,
            @RequestPart("product") Product product,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "video", required = false) MultipartFile video,
            Principal principal) {
        
        if (principal == null) throw new RuntimeException("Unauthorized");

        // Validation for update
        if (images != null && images.size() > MAX_IMAGE_COUNT) {
            throw new RuntimeException("Tối đa " + MAX_IMAGE_COUNT + " hình ảnh.");
        }
        if (video != null && video.getSize() > MAX_VIDEO_SIZE) {
            throw new RuntimeException("Video phải nhỏ hơn 15MB.");
        }

        return ResponseEntity.ok(productService.updateProductWithMedia(id, principal.getName(), product, images, video));
    }

    @DeleteMapping("/seller/delete/{id}")
    public ResponseEntity<String> deleteItem(@PathVariable String id, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        productService.deleteProduct(id, principal.getName());
        return ResponseEntity.ok("Xóa sản phẩm thành công!");
    }
}