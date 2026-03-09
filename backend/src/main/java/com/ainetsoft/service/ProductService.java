package com.ainetsoft.service;

import com.ainetsoft.model.Product;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.ProductRepository;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * UPDATED: Retrieves moderated products for the marketplace.
     * Clients only see items that the Admin has APPROVED.
     */
    public List<Product> getAllActiveProducts() {
        return productRepository.findByStatus("APPROVED");
    }

    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm!"));
    }

    /**
     * Seller feature: Create a new product.
     * Includes Shopee-style verification and PENDING status.
     */
    public Product createProduct(String contactInfo, Product product) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        // 1. Strict verification check
        if (!"VERIFIED".equals(user.getSellerVerification())) {
            throw new RuntimeException("Tài khoản Người bán của bạn chưa được Admin phê duyệt!");
        }

        product.setSellerId(user.getId());
        product.setShopName(user.getFullName()); 
        
        // 2. Default to PENDING for Admin review
        product.setStatus("PENDING"); 
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        log.info("Sản phẩm '{}' từ shop '{}' đang chờ phê duyệt.", product.getName(), user.getFullName());
        return productRepository.save(product);
    }

    /**
     * Seller feature: Update existing product info.
     * Logic: If a seller changes product info, it goes back to PENDING for re-review.
     */
    public Product updateProduct(String productId, String contactInfo, Product updatedData) {
        Product existing = getProductById(productId);
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Xác thực thất bại!"));

        if (!existing.getSellerId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa sản phẩm này!");
        }

        existing.setName(updatedData.getName());
        existing.setDescription(updatedData.getDescription());
        existing.setPrice(updatedData.getPrice());
        existing.setStock(updatedData.getStock());
        existing.setCategory(updatedData.getCategory());
        existing.setImages(updatedData.getImages());
        
        // RE-MODERATION: Edited products must be re-approved
        existing.setStatus("PENDING"); 
        existing.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(existing);
    }

    public void deleteProduct(String productId, String contactInfo) {
        Product existing = getProductById(productId);
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Xác thực thất bại!"));

        if (!existing.getSellerId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền xóa sản phẩm này!");
        }

        productRepository.delete(existing);
    }

    public List<Product> getProductsBySeller(String contactInfo) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        
        return productRepository.findBySellerId(user.getId());
    }
}