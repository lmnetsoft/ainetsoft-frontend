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
     * UPDATED MAPPING: /api/orders/checkout
     */
    @PostMapping("/checkout")
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
     * FIXED MAPPING: Renamed from /my-purchase to /me
     * Matches Postman: http://localhost:8080/api/orders/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyOrders(
            @RequestParam(required = false, defaultValue = "ALL") String status, 
            Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        
        try {
            List<Order> orders = orderService.getUserOrders(principal.getName(), status);
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            // Returns the actual error message as a string to avoid [object Object]
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * SELLER DASHBOARD: Get orders for a specific shop.
     */
    @GetMapping("/seller/incoming")
    public ResponseEntity<?> getSellerOrders(@RequestParam String shopName, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        return ResponseEntity.ok(orderService.getOrdersForSeller(shopName));
    }
}