package com.ainetsoft.service;

import com.ainetsoft.model.Product;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.ProductRepository;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * Retrieves all active products for the marketplace home page.
     */
    public List<Product> getAllActiveProducts() {
        return productRepository.findByStatus("ACTIVE");
    }

    /**
     * Finds a single product by ID.
     */
    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm!"));
    }

    /**
     * Seller feature: Create a new product.
     */
    public Product createProduct(String contactInfo, Product product) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (!user.getRoles().contains("SELLER")) {
            throw new RuntimeException("Bạn cần đăng ký làm Người bán để đăng sản phẩm!");
        }

        product.setSellerId(user.getId());
        product.setShopName(user.getFullName()); // Defaults to User's name as Shop Name
        product.setStatus("ACTIVE");
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(product);
    }

    /**
     * Seller feature: Update existing product info.
     * Includes security check to ensure the editor owns the product.
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
        existing.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(existing);
    }

    /**
     * Seller feature: Delete a product.
     */
    public void deleteProduct(String productId, String contactInfo) {
        Product existing = getProductById(productId);
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Xác thực thất bại!"));

        if (!existing.getSellerId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền xóa sản phẩm này!");
        }

        productRepository.delete(existing);
    }

    /**
     * Seller feature: Get all products belonging to a specific seller.
     */
    public List<Product> getProductsBySeller(String contactInfo) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        
        return productRepository.findBySellerId(user.getId());
    }
}