package com.ainetsoft.service;

import com.ainetsoft.dto.AdminStatsSummary;
import com.ainetsoft.dto.SellerApprovalRequest;
import com.ainetsoft.model.*;
import com.ainetsoft.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    
    // 🚀 NEW: Added for Quick Response Templates
    private final FeedbackTemplateRepository feedbackTemplateRepository;

    /**
     * INTERNAL HELPER: Records admin actions into the Audit Log.
     */
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
                "Cấp quyền Admin với: " + permissions.toString());

        return "Đã nâng cấp " + target.getEmail() + " thành Quản trị viên.";
    }

    public AdminStatsSummary getGlobalStats() {
        log.info("--- Dashboard Stats Sync Initiated ---");
        
        long uCount = userRepository.count();
        long sCount = userRepository.countByRolesContaining("SELLER");
        long pCount = productRepository.count();
        long pendingPCount = productRepository.countByStatus("PENDING");
        
        long pendingSCount = userRepository.countBySellerVerificationOrAccountStatus("PENDING", "PENDING_SELLER");
        
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

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAll().stream()
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    // --- SELLER MODERATION ---

    public List<User> getPendingSellers() {
        List<User> pending = userRepository.findBySellerVerificationOrAccountStatus("PENDING", "PENDING_SELLER");
        pending.forEach(user -> {
            if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
                user.setAvatarUrl("DEFAULT_LOGO"); 
            }
        });
        return pending;
    }

    public User getSellerVerificationDetails(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dữ liệu xác minh!"));
    }

    @Transactional
    public String processSellerApproval(String userId, SellerApprovalRequest request, User performingAdmin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if ("BANNED".equals(user.getAccountStatus())) {
            throw new RuntimeException("Không thể phê duyệt tài khoản đang bị khóa!");
        }

        if (request.isApproved()) {
            user.setSellerVerification("VERIFIED");
            user.setAccountStatus("ACTIVE"); 
            user.setRejectionReason(null);

            Set<String> roles = user.getRoles();
            if (roles == null) roles = new HashSet<>();
            roles.add("SELLER");
            user.setRoles(roles);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            notificationService.createNotification(
                user.getId(), "Yêu cầu nâng cấp Shop thành công",
                "Chúc mừng! Bạn đã chính thức trở thành Người bán.", "SELLER_APPROVAL", null
            );

            try {
                azureEmailService.sendSellerStatusEmail(user.getEmail(), user.getFullName(), true, null);
            } catch (Exception e) {
                log.warn("Approval notification email failed for {}: {}", user.getEmail(), e.getMessage());
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
                "Lý do: " + request.getAdminNote(), 
                "SELLER_REJECTION", null
            );

            recordAudit(performingAdmin, "REJECT_SELLER", user.getId(), user.getEmail(), "Từ chối Shop: " + request.getAdminNote());

            try {
                azureEmailService.sendSellerStatusEmail(user.getEmail(), user.getFullName(), false, request.getAdminNote());
            } catch (Exception e) {
                log.warn("Rejection notification email failed for {}: {}", user.getEmail(), e.getMessage());
            }
            return "Đã từ chối yêu cầu thành công.";
        }
    }

    // --- PRODUCT MODERATION (100% PRESERVED) ---

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

    // --- REPORT MANAGEMENT (100% PRESERVED) ---

    @Transactional
    public String resolveReport(String reportId, String action, User performingAdmin) {
        ProductReport report = productReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Báo cáo không tồn tại!"));

        if ("RESOLVED".equals(action)) {
            report.setStatus("RESOLVED");
            productRepository.findById(report.getProductId()).ifPresent(product -> {
                product.setStatus("BANNED");
                productRepository.save(product); 
                recordAudit(performingAdmin, "CONFIRM_VIOLATION", product.getId(), product.getName(), "Xác nhận vi phạm & Khóa sản phẩm");
            });
        } else {
            report.setStatus("DISMISSED");
            recordAudit(performingAdmin, "DISMISS_REPORT", report.getId(), "Report Record", "Bác bỏ báo cáo vi phạm");
        }
        report.setUpdatedAt(LocalDateTime.now());
        productReportRepository.save(report);
        return "Đã xử lý báo cáo thành công.";
    }

    @Transactional
    public void deleteReport(String reportId, User performingAdmin) {
        productReportRepository.deleteById(reportId);
        recordAudit(performingAdmin, "DELETE_REPORT", reportId, "Violation Record", "Xóa vĩnh viễn báo cáo");
    }

    // --- REVIEW MODERATION (100% PRESERVED) ---

    public List<Review> getAllReviewsForModeration() {
        return reviewRepository.findAll().stream()
                .sorted(Comparator.comparing(Review::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteReview(String reviewId, User performingAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Đánh giá không tồn tại!"));
        
        reviewRepository.delete(review);
        
        recordAudit(performingAdmin, "DELETE_REVIEW", review.getId(), review.getUserName(), 
                "Xóa đánh giá của " + review.getUserName() + " cho sản phẩm ID: " + review.getProductId());
    }

    // --- VIOLATION CATEGORIES (100% PRESERVED) ---

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

    // --- MASTER USER CONTROL (100% PRESERVED) ---
    
    @Transactional
    public String banUser(String userId, User performingAdmin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        
        if (user.isGlobalAdmin() || "admin@ainetsoft.com".equals(user.getEmail())) {
            throw new RuntimeException("KHÔNG THỂ khóa tài khoản Global Admin!");
        }

        user.setAccountStatus("BANNED");
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        
        recordAudit(performingAdmin, "BAN_USER", user.getId(), user.getEmail(), "Khóa tài khoản");
        return "Tài khoản " + user.getEmail() + " đã bị khóa.";
    }

    // --- 🚀 NEW: FEEDBACK TEMPLATE MANAGEMENT ---

    /**
     * Fetch templates for quick response buttons.
     * @param type e.g., "SELLER_REJECTION"
     */
    public List<FeedbackTemplate> getTemplatesByType(String type) {
        return feedbackTemplateRepository.findByType(type);
    }

    /**
     * Saves or updates a professional response template.
     */
    @Transactional
    public FeedbackTemplate saveFeedbackTemplate(FeedbackTemplate template, User performingAdmin) {
        FeedbackTemplate saved = feedbackTemplateRepository.save(template);
        recordAudit(performingAdmin, "MANAGE_TEMPLATES", saved.getId(), saved.getTitle(), 
                "Add/Update response template for " + template.getType());
        return saved;
    }

    /**
     * Deletes a response template.
     */
    @Transactional
    public void deleteFeedbackTemplate(String id, User performingAdmin) {
        feedbackTemplateRepository.deleteById(id);
        recordAudit(performingAdmin, "DELETE_TEMPLATE", id, "Template", "Remove quick response template");
    }
}