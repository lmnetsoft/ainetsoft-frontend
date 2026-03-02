package com.ainetsoft.controller;

import com.ainetsoft.model.Order;
import com.ainetsoft.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * Endpoint: GET /api/orders/me?status=COMPLETED
     * Fetches orders for the logged-in user.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyOrders(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            Principal principal) {
        try {
            // principal.getName() provides the email/phone of the logged-in user
            List<Order> orders = orderService.getUserOrders(principal.getName(), status);
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}