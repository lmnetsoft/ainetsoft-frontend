package com.ainetsoft.service;

import com.ainetsoft.dto.AdminStatsSummary;
import com.ainetsoft.dto.SellerApprovalRequest;
import com.ainetsoft.model.*;
import com.ainetsoft.repository.*;
import com.ainetsoft.service.shipping.ShippingProvider;
import com.ainetsoft.service.shipping.ShippingProviderFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page; 
import org.springframework.data.domain.Pageable; 
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository;
    private final ProductReportRepository productReportRepository;
    private final ReviewRepository reviewRepository;
    private final ReportReasonRepository reportReasonRepository;
    private final AzureCommunicationService azureEmailService;
    private final FeedbackTemplateRepository feedbackTemplateRepository;
    private final SystemContentRepository systemContentRepository;
    private final BankAccountRepository bankAccountRepository;
    private final EncryptionService encryptionService;
    
    // 🚀 INJECT HỆ THỐNG LOGISTICS
    private final ShippingProviderFactory shippingFactory;

    // --- 🚀 NEW: QUICK SEARCH FOR ADMIN SEARCH-AND-PICK ---
    public List<Map<String, Object>> searchUsersQuick(String query) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }
        
        return userRepository.findTop10ByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query)
                .stream()
                .map(user -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", user.getId());
                    map.put("fullName", user.getFullName());
                    map.put("email", user.getEmail());
                    map.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "DEFAULT_LOGO");
                    return map;
                })
                .collect(Collectors.toList());
    }

    private void recordAudit(User admin, String type, String targetId, String targetName, String details) {
        if (admin == null) return;
        AuditLog logEntry = AuditLog.builder()
                .adminId(admin.getId())
                .adminEmail(admin.getEmail())
                .adminName(admin.getFullName())
                .actionType(type)
                .targetId(targetId)
                .targetName(targetName != null ? targetName : "N/A")
                .description(details)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(logEntry);
    }

    @Transactional
    public String promoteToAdmin(String targetUserId, Set<String> permissions, User performingAdmin) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (target.isGlobalAdmin() || "admin@ainetsoft.com".equals(target.getEmail())) {
            throw new RuntimeException("Không thể thay đổi quyền của Global Admin!");
        }

        Set<String> roles = target.getRoles();
        if (roles == null) roles = new HashSet<>();
        roles.add("ADMIN");
        target.setRoles(roles);
        target.setPermissions(permissions);
        target.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(target);

        recordAudit(performingAdmin, "PROMOTE_USER", target.getId(), target.getEmail(), 
                "Cấp quyền Admin with: " + permissions.toString());

        return "Đã nâng cấp " + target.getEmail() + " thành Quản trị viên.";
    }

    @Transactional
    public String demoteFromAdmin(String targetUserId, User performingAdmin) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (target.isGlobalAdmin() || "admin@ainetsoft.com".equals(target.getEmail())) {
            throw new RuntimeException("KHÔNG THỂ thu hồi quyền của Global Admin!");
        }

        if (target.getRoles() != null && target.getRoles().contains("ADMIN")) {
            target.getRoles().remove("ADMIN");
            target.setPermissions(new HashSet<>()); 
            target.setUpdatedAt(LocalDateTime.now());
            userRepository.save(target);

            recordAudit(performingAdmin, "DEMOTE_USER", target.getId(), target.getEmail(), "Thu hồi quyền Quản trị");
            return "Đã thu hồi quyền Quản trị của " + target.getEmail() + " thành công.";
        } else {
            throw new RuntimeException("Người dùng này không có quyền Quản trị viên!");
        }
    }

    public AdminStatsSummary getGlobalStats() {
        log.info("--- Dashboard Stats Sync Initiated ---");
        
        long uCount = userRepository.count();
        long sCount = userRepository.countByRolesContaining("SELLER");
        long pCount = productRepository.count();
        long pendingPCount = productRepository.countByStatus("PENDING");
        
        long pendingSCount = userRepository.countBySellerVerificationOrAccountStatus("PENDING", "PENDING_SELLER") +
                             userRepository.countByHasPendingUpdateTrue();
        
        long reportCount = productReportRepository.count();

        log.info("DB Counts -> Users: {}, Sellers: {}, Reports: {}", uCount, sCount, reportCount);

        List<Order> allOrders = orderRepository.findAll();
        List<Order> completedOrders = allOrders.stream()
                .filter(o -> "COMPLETED".equals(o.getStatus()))
                .collect(Collectors.toList());

        double totalRevenue = completedOrders.stream()
                .mapToDouble(Order::getTotalAmount)
                .sum();

        return AdminStatsSummary.builder()
                .totalUsers(uCount)
                .totalSellers(sCount)
                .totalProducts(pCount)
                .totalOrders((long) allOrders.size())
                .totalRevenue(totalRevenue)
                .pendingProducts(pendingPCount)
                .pendingSellers(pendingSCount)
                .totalReports(reportCount)
                .revenueHistory(generateRevenueHistory(completedOrders))
                .build();
    }

    private List<Map<String, Object>> generateRevenueHistory(List<Order> completedOrders) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("'Tháng' MM");
        
        Map<String, Double> monthlyData = completedOrders.stream()
            .collect(Collectors.groupingBy(
                o -> {
                    LocalDateTime date = o.getCreatedAt() != null ? o.getCreatedAt() : LocalDateTime.now();
                    return date.format(formatter);
                },
                Collectors.summingDouble(Order::getTotalAmount)
            ));

        return monthlyData.entrySet().stream()
            .map(entry -> {
                Map<String, Object> point = new HashMap<>();
                point.put("name", entry.getKey());
                point.put("revenue", entry.getValue());
                return point;
            })
            .sorted(Comparator.comparing(m -> (String) m.get("name")))
            .collect(Collectors.toList());
    }

    public Page<User> getAllUsersFiltered(String search, String role, String status, Pageable pageable) {
        String keyword = (search == null) ? "" : search;
        String roleFilter = (role == null || role.isEmpty()) ? "ALL" : role.toUpperCase();
        String statusFilter = (status == null || status.isEmpty()) ? "ALL" : status.toUpperCase();

        return userRepository.findAllByFilters(keyword, roleFilter, statusFilter, pageable);
    }

    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
    }

    public Map<String, Object> getUserFullProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        List<BankAccount> bankAccounts = bankAccountRepository.findByUserId(userId);
        bankAccounts.forEach(account -> {
            if (account.getAccountNumber() != null) {
                account.setAccountNumber(encryptionService.decrypt(account.getAccountNumber()));
            }
        });

        Map<String, Object> details = new HashMap<>();
        details.put("id", user.getId());
        details.put("fullName", user.getFullName());
        details.put("email", user.getEmail());
        details.put("phone", user.getPhone());
        details.put("gender", user.getGender());
        details.put("birthDate", user.getBirthDate());
        details.put("createdAt", user.getCreatedAt());
        details.put("accountStatus", user.getAccountStatus());
        
        details.put("identityInfo", user.getIdentityInfo());
        details.put("shopProfile", user.getShopProfile());
        details.put("addresses", user.getAddresses());
        details.put("bankAccounts", bankAccounts); 

        if (user.getPendingBankAccount() != null) {
            details.put("pendingBankAccount", user.getPendingBankAccount());
        }

        return details;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAll().stream()
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    public List<User> getPendingSellers() {
        List<User> pending = userRepository.findBySellerVerificationOrAccountStatus("PENDING", "PENDING_SELLER");
        List<User> updates = userRepository.findByHasPendingUpdateTrue();
        
        Set<User> combined = new HashSet<>(pending);
        combined.addAll(updates);
        
        List<User> result = new ArrayList<>(combined);
        result.forEach(user -> {
            if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
                user.setAvatarUrl("DEFAULT_LOGO"); 
            }
        });
        return result;
    }

    public Map<String, Object> getSellerVerificationDetails(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dữ liệu!"));

        List<BankAccount> bankAccounts = bankAccountRepository.findByUserId(userId);
        bankAccounts.forEach(account -> {
            if (account.getAccountNumber() != null) {
                account.setAccountNumber(encryptionService.decrypt(account.getAccountNumber()));
            }
        });

        Map<String, Object> details = new HashMap<>();
        details.put("id", user.getId());
        details.put("fullName", user.getFullName());
        details.put("email", user.getEmail());
        details.put("phone", user.getPhone());
        details.put("gender", user.getGender());
        details.put("birthDate", user.getBirthDate());

        details.put("identityInfo", user.getIdentityInfo());
        details.put("shopProfile", user.getShopProfile());
        details.put("addresses", user.getAddresses());
        details.put("bankAccounts", bankAccounts); 

        details.put("pendingShopProfile", user.getPendingShopProfile());
        details.put("pendingAddresses", user.getPendingAddresses());
        details.put("pendingBankAccount", user.getPendingBankAccount());
        details.put("hasPendingUpdate", user.isHasPendingUpdate());

        return details;
    }

    @Transactional
    public String processSellerApproval(String userId, SellerApprovalRequest request, User performingAdmin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if ("BANNED".equals(user.getAccountStatus())) {
            throw new RuntimeException("Không thể phê duyệt tài khoản đang bị khóa!");
        }

        if (user.isHasPendingUpdate() && "VERIFIED".equalsIgnoreCase(user.getSellerVerification())) {
            return processShopUpdateApproval(user, request, performingAdmin);
        }

        if (request.isApproved()) {
            user.setSellerVerification("VERIFIED");
            user.setAccountStatus("ACTIVE"); 
            user.setRejectionReason(null);

            Set<String> roles = user.getRoles();
            if (roles == null) roles = new HashSet<>();
            roles.add("SELLER");
            user.setRoles(roles);

            // ==========================================
            // 🚀 BƠM ENGINE AUTO-PROVISIONING GHN VÀO ĐÂY 
            // ==========================================
            if (user.getAddresses() != null && !user.getAddresses().isEmpty()) {
                try {
                    ShippingProvider ghnProvider = shippingFactory.getProvider("GHN");
                    
                    // Lấy địa chỉ lấy hàng mặc định
                    User.AddressInfo pickupAddress = user.getAddresses().stream()
                            .filter(User.AddressInfo::isDefault)
                            .findFirst()
                            .orElse(user.getAddresses().get(0));
                            
                    String ghnShopId = ghnProvider.registerShop(user, user.getShopProfile(), pickupAddress);
                    
                    if (ghnShopId != null) {
                        user.getShopProfile().setGhnShopId(ghnShopId);
                        log.info("✅ Kích hoạt GHN thành công! Gắn Shop ID: {} cho Seller: {}", ghnShopId, user.getEmail());
                    } else {
                        log.warn("❌ GHN API không trả về Shop ID cho Seller: {}", user.getEmail());
                    }
                } catch (Exception e) {
                    log.error("❌ Lỗi ngoại lệ khi khởi tạo kho GHN: {}", e.getMessage());
                }
            }
            // ==========================================

            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            notificationService.createNotification(
                user.getId(), "Yêu cầu nâng cấp Shop thành công",
                "Chúc mừng! Bạn đã chính thức trở thành Người bán.", "SELLER_APPROVAL", null
            );

            try {
                azureEmailService.sendSellerStatusEmail(user.getEmail(), user.getFullName(), true, null);
            } catch (Exception e) {
                log.warn("Approval email failed for {}: {}", user.getEmail(), e.getMessage());
            }

            recordAudit(performingAdmin, "APPROVE_SELLER", user.getId(), user.getEmail(), "Phê duyệt Shop");
            return "Người dùng " + user.getFullName() + " đã trở thành Người bán.";
        } else {
            user.setSellerVerification("REJECTED");
            user.setAccountStatus("ACTIVE"); 
            user.setRejectionReason(request.getAdminNote());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            notificationService.createNotification(
                user.getId(), "Yêu cầu nâng cấp Shop bị từ chối",
                "Lý do: " + request.getAdminNote(), "SELLER_REJECTION", null
            );

            recordAudit(performingAdmin, "REJECT_SELLER", user.getId(), user.getEmail(), "Từ chối Shop: " + request.getAdminNote());

            try {
                azureEmailService.sendSellerStatusEmail(user.getEmail(), user.getFullName(), false, request.getAdminNote());
            } catch (Exception e) {
                log.warn("Rejection email failed for {}: {}", user.getEmail(), e.getMessage());
            }
            return "Đã từ chối yêu cầu thành công.";
        }
    }

    @Transactional
    private String processShopUpdateApproval(User user, SellerApprovalRequest request, User performingAdmin) {
        if (request.isApproved()) {
            if (user.getPendingShopProfile() != null) {
                user.setShopProfile(user.getPendingShopProfile());
            }
            
            if (user.getPendingAddresses() != null && !user.getPendingAddresses().isEmpty()) {
                user.setAddresses(new ArrayList<>(user.getPendingAddresses()));
            }

            if (user.getPendingBankAccount() != null) {
                List<BankAccount> existing = bankAccountRepository.findByUserId(user.getId());
                BankAccount target = existing.isEmpty() ? new BankAccount() : existing.get(0);
                
                target.setUserId(user.getId());
                target.setBankName(user.getPendingBankAccount().getBankName());
                target.setAccountHolder(user.getPendingBankAccount().getAccountHolder());
                target.setAccountNumber(encryptionService.encrypt(user.getPendingBankAccount().getAccountNumber()));
                target.setUpdatedAt(LocalDateTime.now());
                
                bankAccountRepository.save(target);
            }
            
            user.setPendingShopProfile(null);
            user.setPendingAddresses(new ArrayList<>());
            user.setPendingBankAccount(null); 
            user.setHasPendingUpdate(false);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            notificationService.createNotification(user.getId(), "Cập nhật Shop thành công",
                "Admin đã phê duyệt các thay đổi thông tin cửa hàng.", "SHOP_UPDATE_APPROVED", null);

            recordAudit(performingAdmin, "APPROVE_SHOP_UPDATE", user.getId(), user.getEmail(), "Phê duyệt cập nhật Shop");
            return "Đã phê duyệt cập nhật Shop thành công.";
        } else {
            user.setPendingShopProfile(null);
            user.setPendingAddresses(new ArrayList<>());
            user.setPendingBankAccount(null);
            user.setHasPendingUpdate(false);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            notificationService.createNotification(user.getId(), "Cập nhật Shop bị từ chối",
                "Lý do: " + request.getAdminNote(), "SHOP_UPDATE_REJECTED", null);

            recordAudit(performingAdmin, "REJECT_SHOP_UPDATE", user.getId(), user.getEmail(), "Từ chối cập nhật Shop: " + request.getAdminNote());
            return "Đã từ chối yêu cầu cập nhật.";
        }
    }

    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    public List<Product> getPendingProducts() {
        return productRepository.findByStatus("PENDING");
    }

    @Transactional
    public String approveProduct(String productId, User performingAdmin) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại!"));
        
        product.setStatus("APPROVED");
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        userRepository.findById(product.getSellerId()).ifPresent(seller -> {
            try {
                azureEmailService.sendProductStatusEmail(seller.getEmail(), seller.getFullName(), product.getName(), true, null);
            } catch (Exception e) {
                log.warn("Email duyệt SP lỗi: {}", e.getMessage());
            }
        });
        
        recordAudit(performingAdmin, "APPROVE_PRODUCT", product.getId(), product.getName(), "Duyệt sản phẩm");
        return "Sản phẩm '" + product.getName() + "' đã được duyệt.";
    }

    @Transactional
    public String rejectProduct(String productId, String reason, User performingAdmin) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại!"));
        
        product.setStatus("REJECTED");
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        userRepository.findById(product.getSellerId()).ifPresent(seller -> {
            try {
                azureEmailService.sendProductStatusEmail(seller.getEmail(), seller.getFullName(), product.getName(), false, reason);
            } catch (Exception e) {
                log.warn("Email từ chối SP lỗi: {}", e.getMessage());
            }
        });
        
        recordAudit(performingAdmin, "REJECT_PRODUCT", product.getId(), product.getName(), "Từ chối: " + reason);
        return "Đã từ chối sản phẩm.";
    }

    @Transactional
    public void deleteProduct(String productId, User performingAdmin) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại!"));
        
        productRepository.delete(product);
        
        recordAudit(performingAdmin, "DELETE_PRODUCT", product.getId(), product.getName(), "Admin xóa sản phẩm");
    }

    @Transactional
    public String resolveReport(String reportId, String action, User performingAdmin) {
        ProductReport report = productReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Báo cáo không tồn tại!"));

        if ("RESOLVED".equals(action)) {
            report.setStatus("RESOLVED");
            productRepository.findById(report.getProductId()).ifPresent(product -> {
                product.setStatus("BANNED");
                productRepository.save(product); 
                recordAudit(performingAdmin, "CONFIRM_VIOLATION", product.getId(), product.getName(), "Xác nhận vi phạm & Khóa SP");
            });
        } else {
            report.setStatus("DISMISSED");
            recordAudit(performingAdmin, "DISMISS_REPORT", report.getId(), "Report", "Bác bỏ báo cáo");
        }
        report.setUpdatedAt(LocalDateTime.now());
        productReportRepository.save(report);
        return "Đã xử lý báo cáo thành công.";
    }

    @Transactional
    public String batchResolveReports(List<String> reportIds, String action, User performingAdmin) {
        if (reportIds == null || reportIds.isEmpty()) return "Không có báo cáo nào được chọn.";
        for (String id : reportIds) {
            try { resolveReport(id, action, performingAdmin); } catch (Exception e) { log.warn("Lỗi xử lý {}: {}", id, e.getMessage()); }
        }
        recordAudit(performingAdmin, "BATCH_RESOLVE_REPORTS", "MULTIPLE", "ProductReports", "Xử lý hàng loạt báo cáo: " + action);
        return "Đã xử lý " + reportIds.size() + " báo cáo thành công.";
    }

    public List<ProductReport> getReportsByReasons(Collection<String> reasons, String status) {
        return productReportRepository.findByReasonInAndStatus(reasons, status);
    }

    @Transactional
    public void deleteReport(String reportId, User performingAdmin) {
        productReportRepository.deleteById(reportId);
        recordAudit(performingAdmin, "DELETE_REPORT", reportId, "Violation Record", "Xóa báo cáo");
    }

    public List<Review> getAllReviewsForModeration() {
        return reviewRepository.findAll().stream()
                .sorted(Comparator.comparing(Review::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteReview(String reviewId, User performingAdmin) {
        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> new RuntimeException("Đánh giá không tồn tại!"));
        reviewRepository.delete(review);
        recordAudit(performingAdmin, "DELETE_REVIEW", review.getId(), review.getUserName(), "Xóa đánh giá: " + review.getProductId());
    }

    @Transactional
    public ReportReason saveViolationReason(ReportReason reason, User performingAdmin) {
        ReportReason saved = reportReasonRepository.save(reason);
        recordAudit(performingAdmin, "MANAGE_CATEGORIES", saved.getId(), saved.getName(), "Thêm/Cập nhật danh mục vi phạm");
        return saved;
    }

    @Transactional
    public void deleteViolationReason(String id, User performingAdmin) {
        reportReasonRepository.deleteById(id);
        recordAudit(performingAdmin, "MANAGE_CATEGORIES", id, "Category", "Xóa danh mục vi phạm");
    }

    @Transactional
    public String banUser(String userId, User performingAdmin) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        if (user.isGlobalAdmin() || "admin@ainetsoft.com".equals(user.getEmail())) throw new RuntimeException("KHÔNG THỂ khóa Global Admin!");
        user.setAccountStatus("BANNED");
        user.setEnabled(false); 
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        recordAudit(performingAdmin, "BAN_USER", user.getId(), user.getEmail(), "Khóa tài khoản");
        return "Tài khoản " + user.getEmail() + " đã bị khóa.";
    }

    @Transactional
    public String toggleUserStatus(String userId, User performingAdmin) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        if (user.isGlobalAdmin() || "admin@ainetsoft.com".equals(user.getEmail())) throw new RuntimeException("KHÔNG THỂ thay đổi Global Admin!");
        String currentStatus = user.getAccountStatus();
        String newStatus = "BANNED".equals(currentStatus) ? "ACTIVE" : "BANNED";
        user.setAccountStatus(newStatus);
        user.setEnabled(!"BANNED".equals(newStatus)); 
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        recordAudit(performingAdmin, newStatus.equals("BANNED") ? "BAN_USER" : "UNBAN_USER", user.getId(), user.getEmail(), "Thay đổi trạng thái tài khoản");
        return "Đã cập nhật trạng thái " + user.getEmail() + " thành công.";
    }

    @Transactional
    public String revokeSellerStatus(String userId, String reason, User performingAdmin) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        Set<String> roles = user.getRoles();
        if (roles != null && roles.contains("SELLER")) {
            roles.remove("SELLER");
            user.setRoles(roles);
            
            user.setSellerVerification("REVOKED"); 
            user.setRejectionReason(reason); 
            
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            notificationService.createNotification(user.getId(), "Quyền Người bán đã bị thu hồi", "Lý do: " + reason, "SELLER_REVOKED", null);
            
            try { 
                azureEmailService.sendSellerStatusEmail(user.getEmail(), user.getFullName(), false, "Quyền người bán bị thu hồi. Lý do: " + reason); 
            } catch (Exception e) { 
                log.warn("Revoke email failed: {}", e.getMessage()); 
            }
            
            recordAudit(performingAdmin, "REVOKE_SELLER", user.getId(), user.getEmail(), "Thu hồi quyền Seller: " + reason);
            return "Đã thu hồi quyền Người bán của " + user.getEmail();
        } else { 
            throw new RuntimeException("Người dùng không phải là Người bán!"); 
        }
    }

    @Transactional
    public String restoreSellerStatus(String userId, User performingAdmin) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (user.getIdentityInfo() == null || user.getShopProfile() == null) {
            throw new RuntimeException("Người dùng này không có dữ liệu hồ sơ Shop để khôi phục!");
        }

        Set<String> roles = user.getRoles();
        if (roles == null) roles = new HashSet<>();
        
        roles.add("SELLER");
        user.setRoles(roles);
        user.setSellerVerification("VERIFIED");
        user.setRejectionReason(null);
        
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        notificationService.createNotification(
            user.getId(), 
            "Quyền Người bán đã được khôi phục", 
            "Quản trị viên đã cấp lại quyền kinh doanh cho bạn. Bạn có thể tiếp tục bán hàng ngay bây giờ.", 
            "SELLER_RESTORED", 
            null
        );

        try {
            azureEmailService.sendSellerStatusEmail(user.getEmail(), user.getFullName(), true, "Quyền người bán đã được khôi phục.");
        } catch (Exception e) {
            log.warn("Restore email failed: {}", e.getMessage());
        }

        recordAudit(performingAdmin, "RESTORE_SELLER", user.getId(), user.getEmail(), "Khôi phục quyền Seller");
        return "Đã khôi phục quyền Người bán cho " + user.getFullName();
    }

    public List<FeedbackTemplate> getTemplatesByType(String type) { return feedbackTemplateRepository.findByType(type); }

    @Transactional
    public FeedbackTemplate saveFeedbackTemplate(FeedbackTemplate template, User performingAdmin) {
        FeedbackTemplate saved = feedbackTemplateRepository.save(template);
        recordAudit(performingAdmin, "MANAGE_TEMPLATES", saved.getId(), saved.getTitle(), "Cập nhật mẫu phản hồi");
        return saved;
    }

    @Transactional
    public void deleteFeedbackTemplate(String id, User performingAdmin) {
        feedbackTemplateRepository.deleteById(id);
        recordAudit(performingAdmin, "DELETE_TEMPLATE", id, "Template", "Xóa mẫu phản hồi");
    }

    public SystemContent getSystemContentBySlug(String slug) { return systemContentRepository.findBySlug(slug).orElseThrow(() -> new RuntimeException("Nội dung không tồn tại: " + slug)); }
    public List<SystemContent> getAllSystemContents() { return systemContentRepository.findAll(); }
    public List<SystemContent> getSystemContentsByCategory(String category) { return systemContentRepository.findByCategory(category); }
    public List<SystemContent> getPublicSystemContents() { return systemContentRepository.findAllByIsActiveTrue(); }

    @Transactional
    public SystemContent saveSystemContent(SystemContent content, User performingAdmin) {
        content.setLastUpdated(LocalDateTime.now());
        if (performingAdmin != null) content.setUpdatedBy(performingAdmin.getFullName());
        SystemContent saved = systemContentRepository.save(content);
        recordAudit(performingAdmin, "UPDATE_SYSTEM_CONTENT", saved.getId(), saved.getTitle(), "Cập nội dung: " + saved.getSlug());
        return saved;
    }

    @Transactional
    public void deleteSystemContent(String id, User performingAdmin) {
        systemContentRepository.findById(id).ifPresent(content -> {
            systemContentRepository.deleteById(id);
            recordAudit(performingAdmin, "DELETE_SYSTEM_CONTENT", id, content.getTitle(), "Xóa trang hệ thống: " + content.getSlug());
        });
    }
}
