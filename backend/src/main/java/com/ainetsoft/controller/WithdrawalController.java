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

    private User getAuthenticatedAdmin(Principal principal) {
        if (principal == null) return null;
        User user = userRepository.findByIdentifier(principal.getName()).orElse(null);
        if (user != null && (user.getRoles().contains("ADMIN") || user.getRoles().contains("ROLE_ADMIN"))) {
            return user;
        }
        return null;
    }

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(Principal principal) {
        User seller = getAuthenticatedSeller(principal);
        if (seller == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Yêu cầu quyền Người bán để xem số dư."));
        }

        double balance = withdrawalService.getSellerBalance(seller.getId());
        return ResponseEntity.ok(Map.of("balance", balance));
    }

    @GetMapping("/admin/pending-count")
    public ResponseEntity<?> getPendingCount(Principal principal) {
        User admin = getAuthenticatedAdmin(principal);
        if (admin == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        long count = withdrawalService.countPendingRequests();
        return ResponseEntity.ok(count);
    }

    @PostMapping("/request")
    public ResponseEntity<?> requestWithdrawal(@RequestBody Map<String, Object> payload, Principal principal) {
        User seller = getAuthenticatedSeller(principal);
        if (seller == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Hành động bị từ chối."));
        }

        // 🚀 BUG FIX: Tránh lỗi ClassCastException khi JSON gởi số nguyên (50000) thay vì số thập phân (50000.0)
        Number rawAmount = (Number) payload.get("amount");
        if (rawAmount == null || rawAmount.doubleValue() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền không hợp lệ."));
        }
        double amount = rawAmount.doubleValue();

        try {
            WithdrawalRequest request = withdrawalService.createWithdrawalRequest(seller.getId(), amount);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            log.error("Withdrawal error for seller {}: {}", seller.getId(), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Principal principal) {
        User seller = getAuthenticatedSeller(principal);
        if (seller == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        List<WithdrawalRequest> history = withdrawalService.getSellerHistory(seller.getId());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllRequests(Principal principal) {
        User admin = getAuthenticatedAdmin(principal);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Yêu cầu quyền Quản trị viên."));
        }
        return ResponseEntity.ok(withdrawalService.getAllRequests());
    }

    @PutMapping("/admin/process/{requestId}")
    public ResponseEntity<?> processRequest(
            @PathVariable String requestId,
            @RequestBody Map<String, String> payload,
            Principal principal) {
        
        User admin = getAuthenticatedAdmin(principal);
        if (admin == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        String status = payload.get("status"); 
        String adminNote = payload.get("adminNote");

        try {
            WithdrawalRequest updated = withdrawalService.processRequest(requestId, status, adminNote);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}