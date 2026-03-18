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
    
    // 🛠️ ADDED: Required for counting violation reports in Stats
    private final ProductReportRepository productReportRepository;

    /**
     * INTERNAL HELPER: Records admin actions into the Audit Log.
     * (KEPT: Essential for security tracking)
     */
    private void recordAudit(User admin, String type, String targetId, String targetName, String details) {
        if (admin == null) return;
        AuditLog logEntry = AuditLog.builder()
                .adminId(admin.getId())
                .adminEmail(admin.getEmail())
                .adminName(admin.getFullName())
                .actionType(type)
                .targetId(targetId)
                .targetName(targetName)
                .description(details)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(logEntry);
    }

    /**
     * NEW DELEGATION FEATURE: Promote a user to Admin with specific permissions.
     * (KEPT: Full original logic preserved)
     */
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

    /**
     * Aggregates Master Stats for the Global Admin Dashboard.
     * FIXED: This now specifically counts "PENDING" to match your UI.
     */
    public AdminStatsSummary getGlobalStats() {
        log.info("--- Dashboard Stats Sync Initiated ---");
        
        long uCount = userRepository.count();
        long sCount = userRepository.countByRolesContaining("SELLER");
        long pCount = productRepository.count();
        long pendingPCount = productRepository.countByStatus("PENDING");
        
        // FIXED SOURCE OF TRUTH: Now explicitly counts the users you see in the "Duyệt Shop" list
        long pendingSCount = userRepository.countBySellerVerification("PENDING");

        // 🛠️ ADDED: Get real count of reports to fix the "0" on dashboard card
        long reportCount = productReportRepository.count();

        log.info("DB Counts -> Users: {}, Sellers: {}, Pending Sellers (Shop): {}, Reports: {}", uCount, sCount, pendingSCount, reportCount);

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
                .totalReports(reportCount) // 🛠️ ADDED: Map to DTO field
                .revenueHistory(generateRevenueHistory(completedOrders))
                .build();
    }

    /**
     * FIXED: Added single quotes around 'Tháng' so Java doesn't think 'T' is a command.
     */
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

    // --- USER MANAGEMENT & LOGS ---

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAll().stream()
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    // --- SELLER MODERATION ---

    /**
     * UPDATED: Injects "DEFAULT_LOGO" if the requester hasn't set an avatar yet.
     * This allows the Frontend to point to logo.svg in its public folder.
     */
    public List<User> getPendingSellers() {
        log.info("Searching for users with sellerVerification: PENDING");
        List<User> pending = userRepository.findBySellerVerification("PENDING");
        
        // BITNAMILEGACY FIX: Identify missing avatars so Frontend can use the SVG logo
        pending.forEach(user -> {
            if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
                user.setAvatarUrl("DEFAULT_LOGO"); 
            }
        });

        log.info("Found {} pending seller requests", pending.size());
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
                user.getId(),
                "Yêu cầu nâng cấp Shop thành công",
                "Chào mừng! Bạn đã chính thức trở thành Người bán.",
                "SELLER_APPROVAL", null
            );

            recordAudit(performingAdmin, "APPROVE_SELLER", user.getId(), user.getEmail(), "Phê duyệt Shop");
            return "Người dùng " + user.getFullName() + " đã trở thành Người bán.";
        } else {
            user.setSellerVerification("REJECTED");
            user.setAccountStatus("ACTIVE"); 
            user.setRejectionReason(request.getAdminNote());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            notificationService.createNotification(
                user.getId(),
                "Yêu cầu nâng cấp Shop bị từ chối",
                "Lý do: " + request.getAdminNote(),
                "SYSTEM", null
            );

            recordAudit(performingAdmin, "REJECT_SELLER", user.getId(), user.getEmail(), "Từ chối Shop: " + request.getAdminNote());
            return "Đã từ chối yêu cầu.";
        }
    }

    // --- PRODUCT MODERATION ---

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

        notificationService.createNotification(
            product.getSellerId(), "Sản phẩm đã được duyệt",
            "Sản phẩm '" + product.getName() + "' hiện đang hiển thị.",
            "SYSTEM", product.getId()
        );
        
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

        notificationService.createNotification(
            product.getSellerId(), "Sản phẩm bị từ chối",
            "Lý do: " + reason, "SYSTEM", product.getId()
        );
        
        recordAudit(performingAdmin, "REJECT_PRODUCT", product.getId(), product.getName(), "Từ chối: " + reason);
        return "Đã từ chối sản phẩm.";
    }
    
    // --- MASTER USER CONTROL ---
    
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
}