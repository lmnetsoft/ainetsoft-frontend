package com.ainetsoft.controller;

import com.ainetsoft.model.Order;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    /**
     * Helper to get the logged-in User object from the Principal (JWT Token)
     */
    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName()).orElse(null);
    }

    /**
     * 🛠️ NEW: POST /api/orders/checkout
     * Handles creating a new order. Fixes the 404 error in the console.
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Order orderRequest, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập để thanh toán"));
        }

        try {
            // Set user info to the order before saving
            orderRequest.setUserId(user.getId());
            orderRequest.setUserEmail(user.getEmail());
            
            Order createdOrder = orderService.createOrder(orderRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi đặt hàng: " + e.getMessage()));
        }
    }

    /**
     * 🛠️ NEW: GET /api/orders/eligible-to-review/{productId}
     * Checks if user can review. Essential for the "Write Review" button logic.
     */
    @GetMapping("/eligible-to-review/{productId}")
    public ResponseEntity<?> checkReviewEligibility(@PathVariable String productId, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.ok(Map.of("eligible", false));

        // Returns { "eligible": true, "orderId": "..." } or { "eligible": false }
        return ResponseEntity.ok(orderService.checkReviewEligibility(productId, user.getId()));
    }

    /**
     * Used by Buyers to see their own purchase history.
     */
    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(@RequestParam(required = false) String status, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập"));
        }
        List<Order> orders = orderService.getUserOrders(user.getEmail(), status);
        return ResponseEntity.ok(orders);
    }

    /**
     * Used by Sellers to see orders placed for their shop.
     */
    @GetMapping("/seller")
    public ResponseEntity<?> getSellerOrders(@RequestParam(required = false) String status, Principal principal) {
        User seller = getAuthenticatedUser(principal);
        if (seller == null || !seller.getRoles().contains("SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Chỉ dành cho Người bán"));
        }
        List<Order> orders = orderService.getOrdersBySeller(seller.getId(), status);
        return ResponseEntity.ok(orders);
    }

    /**
     * Used by Sellers to update the order status.
     */
    @PutMapping("/seller/update-status/{orderId}")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String orderId, 
            @RequestBody Map<String, String> payload, 
            Principal principal) {
        
        User seller = getAuthenticatedUser(principal);
        String newStatus = payload.get("status");

        if (seller == null || !seller.getRoles().contains("SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Quyền truy cập bị từ chối"));
        }

        try {
            Order updatedOrder = orderService.updateStatus(orderId, newStatus, seller.getId());
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Used by Buyers to cancel an order.
     */
    @PostMapping("/cancel/{orderId}")
    public ResponseEntity<?> cancelOrder(@PathVariable String orderId, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập"));
        }

        try {
            orderService.cancelOrder(orderId, user.getId());
            return ResponseEntity.ok(Map.of("message", "Hủy đơn hàng thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}