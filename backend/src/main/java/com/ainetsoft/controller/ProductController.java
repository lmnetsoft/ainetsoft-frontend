package com.ainetsoft.controller;

import com.ainetsoft.model.Product;
import com.ainetsoft.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // --- PUBLIC ENDPOINTS ---

    /**
     * Get all active products for the homepage.
     */
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        // Aligned with ProductService.getAllActiveProducts
        return ResponseEntity.ok(productService.getAllActiveProducts());
    }

    /**
     * Get details for a specific product.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductDetail(@PathVariable String id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    // --- SELLER ENDPOINTS ---

    /**
     * Seller lists a new product.
     */
    @PostMapping("/seller/add")
    public ResponseEntity<Product> createProduct(@RequestBody Product product, Principal principal) {
        if (principal == null) throw new RuntimeException("Bạn cần đăng nhập để thực hiện thao tác này");
        
        // Pass principal.getName() to the service to handle seller lookup and shop naming
        return ResponseEntity.ok(productService.createProduct(principal.getName(), product));
    }

    /**
     * Seller views their own items in "My Shop".
     */
    @GetMapping("/seller/my-items")
    public ResponseEntity<List<Product>> getMyItems(Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(productService.getProductsBySeller(principal.getName()));
    }

    /**
     * Seller updates their item.
     */
    @PutMapping("/seller/update/{id}")
    public ResponseEntity<Product> updateItem(@PathVariable String id, @RequestBody Product product, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(productService.updateProduct(id, principal.getName(), product));
    }

    /**
     * Seller deletes their item.
     */
    @DeleteMapping("/seller/delete/{id}")
    public ResponseEntity<String> deleteItem(@PathVariable String id, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        productService.deleteProduct(id, principal.getName());
        return ResponseEntity.ok("Xóa sản phẩm thành công!");
    }
}