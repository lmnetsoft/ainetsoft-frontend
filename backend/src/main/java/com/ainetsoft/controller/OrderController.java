package com.ainetsoft.controller;

import com.ainetsoft.model.Order;
import com.ainetsoft.service.OrderService;
import lombok.RequiredArgsConstructor;
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

    /**
     * CORE: Place a new order using the items currently in the user's cart.
     * Expected JSON: { "paymentMethod": "COD" }
     */
    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, String> request, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Phiên đăng nhập hết hạn");
        
        try {
            String paymentMethod = request.getOrDefault("paymentMethod", "COD");
            Order order = orderService.placeOrder(principal.getName(), paymentMethod);
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * FRONTEND SYNC: Retrieves user's purchase history for the "My Purchase" page.
     * Supports tabs: ALL, PENDING, SHIPPING, COMPLETED, CANCELLED.
     */
    @GetMapping("/my-purchase")
    public ResponseEntity<?> getMyOrders(
            @RequestParam(required = false, defaultValue = "ALL") String status, 
            Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        
        try {
            List<Order> orders = orderService.getUserOrders(principal.getName(), status);
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * SELLER DASHBOARD: Get orders for a specific shop.
     */
    @GetMapping("/seller/incoming")
    public ResponseEntity<?> getSellerOrders(@RequestParam String shopName, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        // Future: Check if the user actually owns this shopName for security
        return ResponseEntity.ok(orderService.getOrdersForSeller(shopName));
    }
}