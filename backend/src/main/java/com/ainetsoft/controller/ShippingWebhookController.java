package com.ainetsoft.controller;

import com.ainetsoft.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/shipping")
@RequiredArgsConstructor
public class ShippingWebhookController {

    private final OrderService orderService;

    /**
     * MOCK API: Giả lập Endpoint nhận Webhook từ Giao Hàng Nhanh / Viettel Post.
     * Trong thực tế, GHN sẽ gọi API này của bạn mỗi khi trạng thái đơn hàng thay đổi.
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleCarrierWebhook(@RequestBody Map<String, String> payload) {
        String trackingCode = payload.get("trackingCode");
        String carrierStatus = payload.get("status"); // VD: PICKED_UP, IN_TRANSIT, DELIVERED
        String note = payload.get("note");

        log.info("Nhận Webhook từ ĐVVC - Mã vận đơn: {}, Trạng thái mới: {}", trackingCode, carrierStatus);

        try {
            orderService.processShippingWebhook(trackingCode, carrierStatus, note);
            return ResponseEntity.ok(Map.of("message", "Webhook processed successfully", "status", "200 OK"));
        } catch (Exception e) {
            log.error("Lỗi xử lý Webhook: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}