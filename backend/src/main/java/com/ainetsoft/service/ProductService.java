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

    private final String uploadDir = "uploads";

    private String saveFile(MultipartFile file, String subFolder) {
        if (file == null || file.isEmpty()) return null;
        try {
            Path targetDir = Paths.get(uploadDir, subFolder);
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = targetDir.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + subFolder + "/" + fileName;
        } catch (IOException e) {
            log.error("Lỗi khi lưu tệp: {}", e.getMessage());
            throw new RuntimeException("Không thể lưu tệp đính kèm!");
        }
    }

    private void deletePhysicalFile(String storedUrl) {
        if (storedUrl == null || storedUrl.isEmpty() || storedUrl.contains("placeholder.png")) return;
        try {
            String relativePath = storedUrl.startsWith("/") ? storedUrl.substring(1) : storedUrl;
            Path filePath = Paths.get(relativePath);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Đã xóa tệp vật lý thành công: {}", relativePath);
            }
        } catch (IOException e) {
            log.error("Không thể xóa tệp vật lý {}: {}", storedUrl, e.getMessage());
        }
    }

    public List<Product> getAllActiveProducts() {
        return productRepository.findByStatus("APPROVED");
    }

    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm!"));
    }

    public Product createProductWithMedia(String contactInfo, Product product, List<MultipartFile> images, MultipartFile video) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (!"VERIFIED".equals(user.getSellerVerification())) {
            throw new RuntimeException("Tài khoản Người bán của bạn chưa được Admin phê duyệt!");
        }

        String sellerSubFolder = "ads/" + user.getId();

        if (product.getCategoryId() != null) {
            Category category = categoryRepository.findById(product.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Danh mục không hợp lệ!"));
            product.setCategoryName(category.getName());
        }

        // Media Processing
        List<String> imageUrls = new ArrayList<>();
        if (images != null) {
            images.forEach(img -> {
                String url = saveFile(img, sellerSubFolder);
                if (url != null) imageUrls.add(url);
            });
        }
        product.setImageUrls(imageUrls);

        if (video != null && !video.isEmpty()) {
            product.setVideoUrl(saveFile(video, sellerSubFolder));
        }

        // --- DYNAMIC PROFESSIONAL FIELDS ---
        // We trust the configured list coming from the Seller's situational settings
        product.setShippingOptions(product.getShippingOptions() != null ? product.getShippingOptions() : new ArrayList<>());
        product.setProtectionEnabled(product.isProtectionEnabled());
        product.setAllowSharing(product.isAllowSharing());

        product.setSellerId(user.getId());
        product.setShopName(user.getFullName()); 
        product.setStatus("PENDING"); 
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(product);
    }

    public Product updateProductWithMedia(String productId, String contactInfo, Product updatedData, List<MultipartFile> newImages, MultipartFile newVideo) {
        Product existing = getProductById(productId);
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Xác thực thất bại!"));

        if (!existing.getSellerId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa sản phẩm này!");
        }

        String sellerSubFolder = "ads/" + user.getId();

        // Category Sync
        if (updatedData.getCategoryId() != null && !updatedData.getCategoryId().equals(existing.getCategoryId())) {
            Category category = categoryRepository.findById(updatedData.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Danh mục mới không hợp lệ!"));
            existing.setCategoryId(category.getId());
            existing.setCategoryName(category.getName());
        }

        // Image Handling
        if (newImages != null && !newImages.isEmpty()) {
            // If new images provided, we usually append or replace. Here we append.
            List<String> currentList = existing.getImageUrls() != null ? existing.getImageUrls() : new ArrayList<>();
            for (MultipartFile img : newImages) {
                String url = saveFile(img, sellerSubFolder);
                if (url != null) currentList.add(url);
            }
            existing.setImageUrls(currentList);
        }

        if (newVideo != null && !newVideo.isEmpty()) {
            existing.setVideoUrl(saveFile(newVideo, sellerSubFolder));
        }

        // Core Data Update
        existing.setName(updatedData.getName());
        existing.setDescription(updatedData.getDescription());
        existing.setPrice(updatedData.getPrice());
        existing.setStock(updatedData.getStock());
        existing.setSpecifications(updatedData.getSpecifications());
        
        // --- SITUATIONAL CONFIGURATION UPDATE ---
        // Seller can change these values based on their current situation
        existing.setShippingOptions(updatedData.getShippingOptions() != null ? updatedData.getShippingOptions() : new ArrayList<>());
        existing.setProtectionEnabled(updatedData.isProtectionEnabled());
        existing.setAllowSharing(updatedData.isAllowSharing());

        // Note: favoriteCount and totalReports are NOT updated here to prevent reset
        
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

        if (existing.getImageUrls() != null) {
            existing.getImageUrls().forEach(this::deletePhysicalFile);
        }

        if (existing.getVideoUrl() != null) {
            deletePhysicalFile(existing.getVideoUrl());
        }

        productRepository.delete(existing);
    }

    public void bulkDeleteProducts(List<String> productIds, String contactInfo) {
        for (String id : productIds) {
            try {
                deleteProduct(id, contactInfo);
            } catch (Exception e) {
                log.warn("Không thể xóa sản phẩm {}: {}", id, e.getMessage());
            }
        }
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