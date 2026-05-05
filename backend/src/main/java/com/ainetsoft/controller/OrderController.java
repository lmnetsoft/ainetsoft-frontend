package com.ainetsoft.controller;

import com.ainetsoft.model.Order;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; 
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName()).orElse(null);
    }

    private boolean hasRole(User user, String roleName) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().contains(roleName) || user.getRoles().contains("ROLE_" + roleName);
    }

    @GetMapping("/seller/stats")
    public ResponseEntity<?> getSellerStats(Principal principal) {
        User seller = getAuthenticatedUser(principal);
        
        if (!hasRole(seller, "SELLER")) {
            log.warn("Access denied for stats: User {} does not have SELLER role", principal != null ? principal.getName() : "Anonymous");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Quyền truy cập bị từ chối: Yêu cầu quyền Người bán"));
        }
        
        return ResponseEntity.ok(orderService.getSellerStats(seller.getId()));
    }

    @GetMapping("/seller")
    public ResponseEntity<?> getSellerOrders(@RequestParam(required = false) String status, Principal principal) {
        User seller = getAuthenticatedUser(principal);
        
        if (!hasRole(seller, "SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Chỉ dành cho Người bán"));
        }
        
        List<Order> orders = orderService.getOrdersBySeller(seller.getId(), status);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/seller/update-status/{orderId}")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String orderId, 
            @RequestBody Map<String, String> payload, 
            Principal principal) {
        
        User seller = getAuthenticatedUser(principal);
        String newStatus = payload.get("status");

        if (!hasRole(seller, "SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Quyền truy cập bị từ chối"));
        }

        try {
            Order updatedOrder = orderService.updateStatus(orderId, newStatus, seller.getId());
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Order orderRequest, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập để thanh toán"));
        }

        try {
            orderRequest.setUserId(user.getId());
            Order createdOrder = orderService.createOrder(orderRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi đặt hàng: " + e.getMessage()));
        }
    }

    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(@RequestParam(required = false) String status, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập"));
        }
        List<Order> orders = orderService.getUserOrders(principal.getName(), status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderDetail(@PathVariable String orderId, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập để xem chi tiết"));
        }

        try {
            Order order = orderService.getOrderById(orderId);
            
            boolean isOwner = order.getUserId() != null && order.getUserId().equals(user.getId());
            boolean isAuthorizedSellerOrAdmin = hasRole(user, "SELLER") || hasRole(user, "ADMIN");

            if (!isOwner && !isAuthorizedSellerOrAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Bạn không có quyền xem đơn hàng này"));
            }
            
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            log.error("Lỗi khi lấy chi tiết đơn {}: {}", orderId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy đơn hàng"));
        }
    }

    @GetMapping("/eligible-to-review/{productId}")
    public ResponseEntity<?> checkReviewEligibility(@PathVariable String productId, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.ok(Map.of("eligible", false));
        return ResponseEntity.ok(orderService.checkReviewEligibility(productId, user.getId()));
    }

    @PostMapping("/cancel/{orderId}")
    public ResponseEntity<?> cancelOrder(@PathVariable String orderId, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            orderService.cancelOrder(orderId, user.getId());
            return ResponseEntity.ok(Map.of("message", "Hủy đơn hàng thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllSystemOrders(Principal principal) {
        User admin = getAuthenticatedUser(principal);
        
        if (!hasRole(admin, "ADMIN")) {
            log.warn("Access denied for admin orders: User {} does not have ADMIN role", principal != null ? principal.getName() : "Anonymous");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Quyền truy cập bị từ chối: Yêu cầu quyền Admin"));
        }
        
        List<Order> allOrders = orderService.getAllSystemOrders();
        return ResponseEntity.ok(allOrders);
    }
    
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody java.util.Map<String, String> payload) {
        
        String newStatus = payload.get("status");
        
        try {
            com.ainetsoft.model.Order updatedOrder = orderService.updateStatus(orderId, newStatus, null);
            return ResponseEntity.ok(java.util.Map.of("message", "Cập nhật trạng thái thành công!", "order", updatedOrder));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/webhook/shipping")
    public ResponseEntity<?> shippingWebhook(@RequestBody Map<String, String> payload) {
        String trackingCode = payload.get("trackingCode");
        String carrierStatus = payload.get("carrierStatus");
        String note = payload.get("note");
        
        try {
            orderService.processShippingWebhook(trackingCode, carrierStatus, note);
            return ResponseEntity.ok(Map.of("message", "Webhook processed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}