package com.ainetsoft.controller;

import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * 🚀 ĐÃ CẬP NHẬT: Loại bỏ logic updateConfig để tránh xung đột với WithdrawalController.
 * Mọi thay đổi cấu hình Cashback/Xu nay thực hiện tại trang Cấu hình Tài chính tổng.
 */
@RestController
@RequestMapping("/api/admin/coins")
@RequiredArgsConstructor
public class AdminFinanceController {

    private final WalletService walletService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName()).orElse(null);
    }

    private boolean isAdmin(User user) {
        return user != null && user.getRoles() != null && user.getRoles().contains("ADMIN");
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getCoinStats(Principal principal) {
        User admin = getAuthenticatedUser(principal);
        if (!isAdmin(admin)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));
        return ResponseEntity.ok(walletService.getSystemCoinStats());
    }

    // 🚀 CHỈ GIỮ LẠI LOGIC ĐIỀU CHỈNH XU THỦ CÔNG (Tác vụ Vận hành)
    @PostMapping("/adjust")
    public ResponseEntity<?> adjustUserCoins(@RequestBody Map<String, Object> payload, Principal principal) {
        User admin = getAuthenticatedUser(principal);
        if (!isAdmin(admin)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));

        String userId = (String) payload.get("userId");
        if (userId == null || payload.get("amount") == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thông tin không đầy đủ."));
        }

        double amount = Double.parseDouble(payload.get("amount").toString());
        String reason = (String) payload.get("reason");

        try {
            walletService.adjustUserCoins(userId, amount, reason, admin.getFullName());
            return ResponseEntity.ok(Map.of("message", "Điều chỉnh Xu thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
