package com.ainetsoft.controller;

import com.ainetsoft.model.Order;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 🛠️ Added for better debugging
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

    /**
     * Helper to get the current user. 
     * Uses principal.getName() which is the email/identifier from your JWT.
     */
    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName()).orElse(null);
    }

    /**
     * 📊 SELLER DASHBOARD STATS
     * Fix: Changed "SELLER" to "ROLE_SELLER" to match your DB logs.
     */
    @GetMapping("/seller/stats")
    public ResponseEntity<?> getSellerStats(Principal principal) {
        User seller = getAuthenticatedUser(principal);
        
        // 🛠️ BUG FIX: Match the ROLE_ prefix from your logs
        if (seller == null || !seller.getRoles().contains("ROLE_SELLER")) {
            log.warn("Access denied for stats: User {} does not have ROLE_SELLER", principal.getName());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Quyền truy cập bị từ chối: Yêu cầu quyền Người bán"));
        }
        
        return ResponseEntity.ok(orderService.getSellerStats(seller.getId()));
    }

    /**
     * 📦 LIST ORDERS FOR SELLER
     */
    @GetMapping("/seller")
    public ResponseEntity<?> getSellerOrders(@RequestParam(required = false) String status, Principal principal) {
        User seller = getAuthenticatedUser(principal);
        if (seller == null || !seller.getRoles().contains("ROLE_SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Chỉ dành cho Người bán"));
        }
        
        List<Order> orders = orderService.getOrdersBySeller(seller.getId(), status);
        return ResponseEntity.ok(orders);
    }

    /**
     * ✅ UPDATE ORDER STATUS (e.g., PENDING -> SHIPPING)
     */
    @PutMapping("/seller/update-status/{orderId}")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String orderId, 
            @RequestBody Map<String, String> payload, 
            Principal principal) {
        
        User seller = getAuthenticatedUser(principal);
        String newStatus = payload.get("status");

        if (seller == null || !seller.getRoles().contains("ROLE_SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Quyền truy cập bị từ chối"));
        }

        try {
            Order updatedOrder = orderService.updateStatus(orderId, newStatus, seller.getId());
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- BUYER / CUSTOMER ENDPOINTS ---

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Order orderRequest, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập để thanh toán"));
        }

        try {
            orderRequest.setUserId(user.getId());
            orderRequest.setUserEmail(user.getEmail());
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
        // Passing the identifier (email) works best with your Service logic
        List<Order> orders = orderService.getUserOrders(principal.getName(), status);
        return ResponseEntity.ok(orders);
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
}