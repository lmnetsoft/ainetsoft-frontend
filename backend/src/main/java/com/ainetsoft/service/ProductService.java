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

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductReportRepository productReportRepository;

    private final String uploadDir = "uploads";

    // --- PRIVATE FILE HELPERS ---

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
            
            // 🚀 FIXED: Added "/api/" prefix
            return "/api/uploads/" + subFolder + "/" + fileName;
        } catch (IOException e) {
            log.error("Lỗi khi lưu tệp: {}", e.getMessage());
            throw new RuntimeException("Không thể lưu tệp đính kèm!");
        }
    }

    private void deletePhysicalFile(String storedUrl) {
        if (storedUrl == null || storedUrl.isEmpty() || storedUrl.contains("placeholder.png")) return;
        try {
            // 🚀 FIXED: Strip out /api/ if it exists before deleting
            String relativePath = storedUrl.startsWith("/api/") ? storedUrl.substring(5) : 
                                  storedUrl.startsWith("/") ? storedUrl.substring(1) : storedUrl;
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

    public Map<String, Object> getPublicShopData(String slugOrId) {
        // 🚀 FIXED: Support both Slug and ID
        User seller = userRepository.findByShopProfile_ShopSlug(slugOrId)
                .orElseGet(() -> userRepository.findById(slugOrId)
                .orElseThrow(() -> new RuntimeException("Cửa hàng không tồn tại hoặc đã đổi địa chỉ.")));

        List<Product> allProducts = productRepository.findBySellerId(seller.getId());

        List<Product> products = new ArrayList<>();
        for (Product p : allProducts) {
            String status = p.getStatus() != null ? p.getStatus().toUpperCase() : "";
            if (status.equals("ACTIVE") || status.equals("APPROVED") || status.equals("1")) {
                products.add(p);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("seller", seller);
        response.put("products", products);
        
        return response;
    }

    public List<Product> getAllActiveProducts() {
        List<Product> active = productRepository.findByStatus("ACTIVE");
        List<Product> approved = productRepository.findByStatus("APPROVED");
        Set<Product> combined = new LinkedHashSet<>(active);
        combined.addAll(approved);
        return new ArrayList<>(combined);
    }

    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm!"));
    }

    // --- DASHBOARD STATS ---
    public Map<String, Long> getSellerProductStats(String contactInfo) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Not found"));
        List<Product> products = productRepository.findBySellerId(user.getId());
        
        long pending = products.stream().filter(p -> "PENDING".equals(p.getStatus())).count();
        long banned = products.stream().filter(p -> "BANNED".equals(p.getStatus())).count();
        
        int threshold = 5;
        if (user.getShopProfile() != null && user.getShopProfile().getLowStockThreshold() > 0) {
            threshold = user.getShopProfile().getLowStockThreshold();
        }
        
        final int finalThreshold = threshold;
        long lowStockCount = products.stream().filter(p -> p.getStock() < finalThreshold).count();
        
        return Map.of(
            "pending", pending, 
            "banned", banned, 
            "lowStockCount", lowStockCount
        );
    }


    // =======================================================
    // 🛠️ WISHLIST PERSISTENCE LOGIC
    // =======================================================

    @Transactional
    public void toggleFavorite(String productId, String userEmail) {
        Product product = getProductById(productId);
        User user = userRepository.findByIdentifier(userEmail)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

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

    // --- 🛡️ RESTORED: VIOLATION REPORTING LOGIC ---

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

    // --- CRUD OPERATIONS ---

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
        
        // 🚀 STRICT MODERATION FLAG: ONLY triggers for Media changes
        boolean needsModeration = false;

        // --- 1. MEDIA CHECKS (HÌNH ẢNH & VIDEO) ---

        // A. Check if existing images were deleted or rearranged by comparing URLs
        List<String> oldImages = existing.getImageUrls() != null ? existing.getImageUrls() : new ArrayList<>();
        List<String> passedImages = updatedData.getImageUrls() != null ? updatedData.getImageUrls() : new ArrayList<>();
        if (!oldImages.equals(passedImages)) {
            needsModeration = true;
            existing.setImageUrls(passedImages); // Apply the deletion/rearrangement
        }

        // B. Check for newly uploaded images
        if (newImages != null && !newImages.isEmpty()) {
            List<String> currentList = existing.getImageUrls() != null ? existing.getImageUrls() : new ArrayList<>();
            for (MultipartFile img : newImages) {
                String url = saveFile(img, sellerSubFolder);
                if (url != null) currentList.add(url);
            }
            existing.setImageUrls(currentList);
            needsModeration = true;
        }

        // C. Check for new video upload
        if (newVideo != null && !newVideo.isEmpty()) {
            existing.setVideoUrl(saveFile(newVideo, sellerSubFolder));
            needsModeration = true;
        }

        // D. Check if existing video was deleted
        String oldVideo = existing.getVideoUrl() == null ? "" : existing.getVideoUrl();
        String passedVideo = updatedData.getVideoUrl() == null ? "" : updatedData.getVideoUrl();
        if (!oldVideo.equals(passedVideo)) {
            existing.setVideoUrl(passedVideo.isEmpty() ? null : passedVideo);
            needsModeration = true;
        }

        // --- 2. ALL OTHER FIELDS (Saves directly, NO moderation trigger) ---

        if (updatedData.getCategoryId() != null && !updatedData.getCategoryId().equals(existing.getCategoryId())) {
            Category category = categoryRepository.findById(updatedData.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Danh mục mới không hợp lệ!"));
            existing.setCategoryId(category.getId());
            existing.setCategoryName(category.getName());
        }

        existing.setName(updatedData.getName() != null ? updatedData.getName() : existing.getName());
        existing.setDescription(updatedData.getDescription() != null ? updatedData.getDescription() : existing.getDescription());
        existing.setPrice(updatedData.getPrice());
        existing.setStock(updatedData.getStock());
        existing.setSpecifications(updatedData.getSpecifications());
        existing.setShippingOptions(updatedData.getShippingOptions() != null ? updatedData.getShippingOptions() : existing.getShippingOptions());
        existing.setProtectionEnabled(updatedData.isProtectionEnabled());
        existing.setAllowSharing(updatedData.isAllowSharing());

        // --- 3. APPLY MODERATION STATUS ---
        
        // ONLY switch to PENDING if Hình ảnh & Video were touched
        if (needsModeration) {
            existing.setStatus("PENDING");
            log.info("Product {} set to PENDING because HÌNH ẢNH & VIDEO was modified.", existing.getId());
        }

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

    // --- 🛡️ RESTORED: WRAPPER METHODS ---
    public Product createProduct(String contactInfo, Product product) { 
        return createProductWithMedia(contactInfo, product, null, null); 
    }
    
    public Product updateProduct(String productId, String contactInfo, Product updatedData) { 
        return updateProductWithMedia(productId, contactInfo, updatedData, null, null); 
    }
}