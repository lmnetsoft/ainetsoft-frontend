package com.ainetsoft.service;

import com.ainetsoft.model.Category;
import com.ainetsoft.model.Product;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.CategoryRepository;
import com.ainetsoft.repository.ProductRepository;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    private final String uploadDir = "uploads/";

    private String saveFile(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            Path path = Paths.get(uploadDir);
            if (!Files.exists(path)) Files.createDirectories(path);

            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = path.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            return "/uploads/" + fileName;
        } catch (IOException e) {
            log.error("Lỗi khi lưu tệp: {}", e.getMessage());
            throw new RuntimeException("Không thể lưu tệp đính kèm!");
        }
    }

    public List<Product> getAllActiveProducts() {
        return productRepository.findByStatus("APPROVED");
    }

    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm!"));
    }

    /**
     * UPDATED: Now validates dynamic Category and saves Specifications.
     */
    public Product createProductWithMedia(String contactInfo, Product product, List<MultipartFile> images, MultipartFile video) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (!"VERIFIED".equals(user.getSellerVerification())) {
            throw new RuntimeException("Tài khoản Người bán của bạn chưa được Admin phê duyệt!");
        }

        // 1. Dynamic Category Lookup
        if (product.getCategoryId() != null) {
            Category category = categoryRepository.findById(product.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Danh mục không hợp lệ!"));
            product.setCategoryName(category.getName());
        }

        // 2. Process Media
        List<String> imageUrls = new ArrayList<>();
        if (images != null) {
            images.forEach(img -> {
                String url = saveFile(img);
                if (url != null) imageUrls.add(url);
            });
        }
        product.setImageUrls(imageUrls);

        if (video != null && !video.isEmpty()) {
            product.setVideoUrl(saveFile(video));
        }

        product.setSellerId(user.getId());
        product.setShopName(user.getFullName()); 
        product.setStatus("PENDING"); 
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(product);
    }

    /**
     * UPDATED: Handles category changes and specification updates.
     */
    public Product updateProductWithMedia(String productId, String contactInfo, Product updatedData, List<MultipartFile> newImages, MultipartFile newVideo) {
        Product existing = getProductById(productId);
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Xác thực thất bại!"));

        if (!existing.getSellerId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa sản phẩm này!");
        }

        // Update Category logic
        if (updatedData.getCategoryId() != null && !updatedData.getCategoryId().equals(existing.getCategoryId())) {
            Category category = categoryRepository.findById(updatedData.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Danh mục mới không hợp lệ!"));
            existing.setCategoryId(category.getId());
            existing.setCategoryName(category.getName());
        }

        // Media management
        if (newImages != null && !newImages.isEmpty()) {
            List<String> updatedImageUrls = new ArrayList<>();
            newImages.forEach(img -> {
                String url = saveFile(img);
                if (url != null) updatedImageUrls.add(url);
            });
            existing.setImageUrls(updatedImageUrls);
        }

        if (newVideo != null && !newVideo.isEmpty()) {
            existing.setVideoUrl(saveFile(newVideo));
        }

        // Core data and Smart Features (Specifications)
        existing.setName(updatedData.getName());
        existing.setDescription(updatedData.getDescription());
        existing.setPrice(updatedData.getPrice());
        existing.setStock(updatedData.getStock());
        existing.setSpecifications(updatedData.getSpecifications());
        
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

    public Product createProduct(String contactInfo, Product product) {
        return createProductWithMedia(contactInfo, product, null, null);
    }

    public Product updateProduct(String productId, String contactInfo, Product updatedData) {
        return updateProductWithMedia(productId, contactInfo, updatedData, null, null);
    }
}