package com.ainetsoft.service;

import com.ainetsoft.dto.AdminStatsSummary;
import com.ainetsoft.dto.SellerApprovalRequest;
import com.ainetsoft.model.User;
import com.ainetsoft.model.Product;
import com.ainetsoft.model.Order;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.ProductRepository;
import com.ainetsoft.repository.AdminRepository;
import com.ainetsoft.repository.OrderRepository;
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
    private final AdminRepository adminRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    /**
     * Aggregates Master Stats for the Global Admin Dashboard.
     * Provides the data for the Recharts graph and KPI cards.
     */
    public AdminStatsSummary getGlobalStats() {
        // 1. Order & Revenue Metrics
        List<Order> allOrders = orderRepository.findAll();
        List<Order> completedOrders = allOrders.stream()
                .filter(o -> "COMPLETED".equals(o.getStatus()))
                .collect(Collectors.toList());

        double totalRevenue = completedOrders.stream()
                .mapToDouble(Order::getTotalAmount)
                .sum();

        // 2. Build and Return the DTO
        return AdminStatsSummary.builder()
                .totalUsers(userRepository.count())
                .totalSellers(userRepository.countByRolesContaining("SELLER"))
                .totalProducts(productRepository.count())
                .totalOrders((long) allOrders.size())
                .totalRevenue(totalRevenue)
                .pendingProducts((long) productRepository.findByStatus("PENDING").size())
                .pendingSellers((long) adminRepository.findBySellerVerification("PENDING").size())
                .revenueHistory(generateRevenueHistory(completedOrders))
                .build();
    }

    /**
     * Helper to group completed orders by month for the React AreaChart.
     */
    private List<Map<String, Object>> generateRevenueHistory(List<Order> completedOrders) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("Tháng MM");
        
        Map<String, Double> monthlyData = completedOrders.stream()
            .collect(Collectors.groupingBy(
                o -> o.getCreatedAt().format(formatter),
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

    // --- SELLER MODERATION ---

    public List<User> getPendingSellers() {
        return adminRepository.findBySellerVerification("PENDING");
    }

    @Transactional
    public String processSellerApproval(String userId, SellerApprovalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if ("BANNED".equals(user.getAccountStatus())) {
            throw new RuntimeException("Không thể phê duyệt tài khoản đang bị khóa!");
        }

        if (request.isApproved()) {
            user.setSellerVerification("VERIFIED");
            
            Set<String> roles = user.getRoles();
            if (roles == null) roles = new HashSet<>();
            roles.add("SELLER");
            user.setRoles(roles);
            
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            notificationService.createNotification(
                user.getId(),
                "Yêu cầu nâng cấp Shop thành công",
                "Chào mừng! Bạn đã chính thức trở thành Người bán trên AiNetsoft. Hãy đăng sản phẩm đầu tiên ngay!",
                "SELLER_APPROVAL",
                null
            );

            log.info("ADMIN_ACTION: User {} approved as SELLER.", user.getEmail());
            return "Người dùng " + user.getFullName() + " đã chính thức trở thành Người bán.";
        } else {
            user.setSellerVerification("REJECTED");
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            notificationService.createNotification(
                user.getId(),
                "Yêu cầu nâng cấp Shop bị từ chối",
                "Rất tiếc, yêu cầu của bạn không được duyệt. Lý do: " + request.getAdminNote(),
                "SYSTEM",
                null
            );

            log.warn("ADMIN_ACTION: User {} rejected. Reason: {}", user.getEmail(), request.getAdminNote());
            return "Đã từ chối yêu cầu. Lý do: " + request.getAdminNote();
        }
    }

    // --- PRODUCT MODERATION ---

    public List<Product> getPendingProducts() {
        return productRepository.findByStatus("PENDING");
    }

    public String approveProduct(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại!"));
        
        product.setStatus("APPROVED");
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        notificationService.createNotification(
            product.getSellerId(),
            "Sản phẩm đã được duyệt",
            "Sản phẩm '" + product.getName() + "' của bạn đã được duyệt và hiện đang hiển thị công khai.",
            "SYSTEM",
            product.getId()
        );
        
        log.info("ADMIN_ACTION: Product '{}' approved.", product.getName());
        return "Sản phẩm '" + product.getName() + "' đã được duyệt và hiển thị.";
    }

    public String rejectProduct(String productId, String reason) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại!"));
        
        product.setStatus("REJECTED");
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        notificationService.createNotification(
            product.getSellerId(),
            "Sản phẩm bị từ chối",
            "Sản phẩm '" + product.getName() + "' không được duyệt. Lý do: " + reason,
            "SYSTEM",
            product.getId()
        );
        
        log.warn("ADMIN_ACTION: Product '{}' rejected. Reason: {}", product.getName(), reason);
        return "Đã từ chối sản phẩm. Lý do: " + reason;
    }
    
    // --- MASTER USER CONTROL ---
    
    public String banUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        
        if (user.getRoles().contains("ADMIN")) {
            throw new RuntimeException("Không thể khóa tài khoản Quản trị viên!");
        }

        user.setAccountStatus("BANNED");
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        
        log.error("ADMIN_ACTION: Account {} has been BANNED.", user.getEmail());
        return "Tài khoản " + user.getEmail() + " đã bị khóa vĩnh viễn.";
    }
}