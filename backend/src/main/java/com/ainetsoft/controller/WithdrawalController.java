package com.ainetsoft.controller;

import com.ainetsoft.model.User;
import com.ainetsoft.model.WithdrawalRequest;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.WithdrawalService;
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
@RequestMapping("/api/withdrawals")
@RequiredArgsConstructor
public class WithdrawalController {

    private final WithdrawalService withdrawalService;
    private final UserRepository userRepository;

    private User getAuthenticatedSeller(Principal principal) {
        if (principal == null) return null;
        User user = userRepository.findByIdentifier(principal.getName()).orElse(null);
        if (user != null && (user.getRoles().contains("SELLER") || user.getRoles().contains("ROLE_SELLER"))) {
            return user;
        }
        return null;
    }

    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName()).orElse(null);
    }

    private User getAuthenticatedAdmin(Principal principal) {
        if (principal == null) return null;
        User user = userRepository.findByIdentifier(principal.getName()).orElse(null);
        if (user != null && (user.getRoles().contains("ADMIN") || user.getRoles().contains("ROLE_ADMIN"))) {
            return user;
        }
        return null;
    }

    // ==============================
    // ENDPOINTS CHO SELLER
    // ==============================
    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(Principal principal) {
        User seller = getAuthenticatedSeller(principal);
        if (seller == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Từ chối truy cập."));
        return ResponseEntity.ok(Map.of("balance", withdrawalService.getSellerBalance(seller.getId())));
    }

    @PostMapping("/request")
    public ResponseEntity<?> requestWithdrawal(@RequestBody Map<String, Object> payload, Principal principal) {
        User seller = getAuthenticatedSeller(principal);
        if (seller == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Hành động bị từ chối."));

        Number rawAmount = (Number) payload.get("amount");
        if (rawAmount == null || rawAmount.doubleValue() <= 0) return ResponseEntity.badRequest().body(Map.of("message", "Số tiền không hợp lệ."));

        try {
            return ResponseEntity.ok(withdrawalService.createWithdrawalRequest(seller.getId(), rawAmount.doubleValue()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Principal principal) {
        User seller = getAuthenticatedSeller(principal);
        if (seller == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(withdrawalService.getSellerHistory(seller.getId()));
    }

    // ==============================
    // 🚀 ENDPOINTS CHO BUYER (USER)
    // ==============================
    @PostMapping("/user/request")
    public ResponseEntity<?> requestUserWithdrawal(@RequestBody Map<String, Object> payload, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Number rawAmount = (Number) payload.get("amount");
        if (rawAmount == null || rawAmount.doubleValue() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền không hợp lệ."));
        }

        try {
            return ResponseEntity.ok(withdrawalService.createUserWithdrawalRequest(user.getId(), rawAmount.doubleValue()));
        } catch (Exception e) {
            log.error("User Withdrawal error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/history")
    public ResponseEntity<?> getUserHistory(Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(withdrawalService.getUserHistory(user.getId()));
    }

    // ==============================
    // ENDPOINTS CHO ADMIN
    // ==============================
    @GetMapping("/admin/pending-count")
    public ResponseEntity<?> getPendingCount(Principal principal) {
        User admin = getAuthenticatedAdmin(principal);
        if (admin == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(withdrawalService.countPendingRequests());
    }

    // 🚀 BỔ SUNG: Nhận tham số page, size, status để phân trang
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ALL") String status,
            Principal principal) {
        User admin = getAuthenticatedAdmin(principal);
        if (admin == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        
        // Trả về đối tượng Page<?> chuẩn của Spring Data
        return ResponseEntity.ok(withdrawalService.getAllRequests(page, size, status));
    }

    @PutMapping("/admin/process/{requestId}")
    public ResponseEntity<?> processRequest(@PathVariable String requestId, @RequestBody Map<String, String> payload, Principal principal) {
        User admin = getAuthenticatedAdmin(principal);
        if (admin == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            return ResponseEntity.ok(withdrawalService.processRequest(requestId, payload.get("status"), payload.get("adminNote")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 🚀 API ĐỔI TRẠNG THÁI TỰ ĐỘNG CHUYỂN TIỀN
    @GetMapping("/admin/config/auto-payout")
    public ResponseEntity<?> getAutoPayoutConfig(Principal principal) {
        if (getAuthenticatedAdmin(principal) == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(Map.of("autoPayoutEnabled", withdrawalService.getAutoPayoutStatus()));
    }

    @PutMapping("/admin/config/auto-payout")
    public ResponseEntity<?> toggleAutoPayout(@RequestBody Map<String, Boolean> payload, Principal principal) {
        if (getAuthenticatedAdmin(principal) == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        boolean status = payload.getOrDefault("enabled", false);
        withdrawalService.toggleAutoPayout(status);
        return ResponseEntity.ok(Map.of("autoPayoutEnabled", status));
    }
}
