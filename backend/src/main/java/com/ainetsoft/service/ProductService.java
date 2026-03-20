package com.ainetsoft.service;

import com.ainetsoft.model.Category;
import com.ainetsoft.model.Product;
import com.ainetsoft.model.ProductReport;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.CategoryRepository;
import com.ainetsoft.repository.ProductReportRepository;
import com.ainetsoft.repository.ProductRepository;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductReportRepository productReportRepository;

    private final String uploadDir = "uploads";

    // --- PRIVATE FILE HELPERS (100% PRESERVED) ---

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

    // --- PUBLIC PRODUCT LOGIC ---

    public List<Product> getAllActiveProducts() {
        return productRepository.findByStatus("APPROVED");
    }

    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm!"));
    }

    // =======================================================
    // 🛠️ FIXED: WISHLIST PERSISTENCE LOGIC (Set<String> Fix)
    // =======================================================
    
    /**
     * Requirement 4: Fixed Compilation Error.
     * Uses Set<String> to match the User model requirement.
     */
    @Transactional
    public void toggleFavorite(String productId, String userEmail) {
        Product product = getProductById(productId);
        User user = userRepository.findByIdentifier(userEmail)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        // 🛠️ FIX: Changed from List to Set
        Set<String> favorites = user.getFavoriteProductIds();
        if (favorites == null) favorites = new HashSet<>();

        if (favorites.contains(productId)) {
            favorites.remove(productId);
            product.setFavoriteCount(Math.max(0, product.getFavoriteCount() - 1));
            log.info("User {} removed product {} from wishlist", userEmail, productId);
        } else {
            favorites.add(productId);
            product.setFavoriteCount(product.getFavoriteCount() + 1);
            log.info("User {} added product {} to wishlist", userEmail, productId);
        }

        user.setFavoriteProductIds(favorites);
        userRepository.save(user);
        productRepository.save(product);
    }

    // --- VIOLATION REPORTING LOGIC ---

    @Transactional
    public void createProductReport(String productId, String reporterIdentifier, Map<String, Object> reportData) {
        Product product = getProductById(productId);
        
        User reporter = userRepository.findByIdentifier(reporterIdentifier)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        ProductReport report = ProductReport.builder()
                .productId(productId)
                .productName(product.getName())
                .sellerId(product.getSellerId())
                .reporterId(reporter.getId())
                .reporterName(reporter.getFullName()) 
                .reason((String) reportData.get("reason"))
                .details((String) reportData.get("details"))
                .evidenceUrls((List<String>) reportData.get("evidenceUrls"))
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        productReportRepository.save(report);

        product.setTotalReports(product.getTotalReports() + 1);
        productRepository.save(product);

        log.warn("Ticket Created: '{}' reported by {}.", product.getName(), reporter.getFullName());
    }

    public void incrementShareCount(String id) {
        Product product = getProductById(id);
        product.setShareCount(product.getShareCount() + 1);
        productRepository.save(product);
    }

    public void incrementReportCount(String id) {
        Product product = getProductById(id);
        product.setTotalReports(product.getTotalReports() + 1);
        productRepository.save(product);
    }

    @Transactional
    public void updateProductStatus(Product product) {
        log.info("Admin status update for {}: {}", product.getId(), product.getStatus());
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);
    }

    // --- CRUD OPERATIONS (100% RESTORED) ---

    public Product createProductWithMedia(String contactInfo, Product product, List<MultipartFile> images, MultipartFile video) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (!"VERIFIED".equals(user.getSellerVerification())) {
            throw new RuntimeException("Tài khoản Người bán chưa được phê duyệt!");
        }

        String sellerSubFolder = "ads/" + user.getId();

        if (product.getCategoryId() != null) {
            Category category = categoryRepository.findById(product.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Danh mục không hợp lệ!"));
            product.setCategoryName(category.getName());
        }

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
            throw new RuntimeException("Không có quyền chỉnh sửa!");
        }

        String sellerSubFolder = "ads/" + user.getId();

        if (updatedData.getCategoryId() != null && !updatedData.getCategoryId().equals(existing.getCategoryId())) {
            Category category = categoryRepository.findById(updatedData.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Danh mục mới không hợp lệ!"));
            existing.setCategoryId(category.getId());
            existing.setCategoryName(category.getName());
        }

        if (newImages != null && !newImages.isEmpty()) {
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

        existing.setName(updatedData.getName());
        existing.setDescription(updatedData.getDescription());
        existing.setPrice(updatedData.getPrice());
        existing.setStock(updatedData.getStock());
        existing.setSpecifications(updatedData.getSpecifications());
        existing.setShippingOptions(updatedData.getShippingOptions() != null ? updatedData.getShippingOptions() : new ArrayList<>());
        existing.setProtectionEnabled(updatedData.isProtectionEnabled());
        existing.setAllowSharing(updatedData.isAllowSharing());

        existing.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(existing);
    }

    public void deleteProduct(String productId, String contactInfo) {
        Product existing = getProductById(productId);
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Xác thực thất bại!"));

        if (!existing.getSellerId().equals(user.getId())) {
            throw new RuntimeException("Không có quyền xóa!");
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
            try { deleteProduct(id, contactInfo); } catch (Exception e) { log.warn("Skip: {}", id); }
        }
    }

    public List<Product> getProductsBySeller(String contactInfo) {
        User user = userRepository.findByIdentifier(contactInfo).orElseThrow(() -> new RuntimeException("Not found"));
        return productRepository.findBySellerId(user.getId());
    }

    public Product createProduct(String contactInfo, Product product) { return createProductWithMedia(contactInfo, product, null, null); }
    public Product updateProduct(String productId, String contactInfo, Product updatedData) { return updateProductWithMedia(productId, contactInfo, updatedData, null, null); }
}