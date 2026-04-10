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

    /**
     * 🛠️ SECURITY FIX: Updated to handle both "SELLER" and "ROLE_SELLER" formats.
     * This ensures compatibility between the DataSeeder and Spring Security.
     */
    private User getAuthenticatedSeller(Principal principal) {
        if (principal == null) return null;
        User user = userRepository.findByIdentifier(principal.getName()).orElse(null);
        if (user != null && (user.getRoles().contains("SELLER") || user.getRoles().contains("ROLE_SELLER"))) {
            return user;
        }
        return null;
    }

    /**
     * 🛠️ SECURITY FIX: Updated to handle both "ADMIN" and "ROLE_ADMIN" formats.
     */
    private User getAuthenticatedAdmin(Principal principal) {
        if (principal == null) return null;
        User user = userRepository.findByIdentifier(principal.getName()).orElse(null);
        if (user != null && (user.getRoles().contains("ADMIN") || user.getRoles().contains("ROLE_ADMIN"))) {
            return user;
        }
        return null;
    }

    /**
     * 💰 FOR SELLER: GET CURRENT WALLET BALANCE
     * Returns the live calculated balance for the logged-in seller.
     */
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

    /**
     * 🔔 FOR ADMIN: GET PENDING REQUEST COUNT
     * Fixes the NoResourceFoundException (404) for the Admin Notification Bell.
     */
    @GetMapping("/admin/pending-count")
    public ResponseEntity<?> getPendingCount(Principal principal) {
        User admin = getAuthenticatedAdmin(principal);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        long count = withdrawalService.countPendingRequests();
        return ResponseEntity.ok(count);
    }

    /**
     * 📝 FOR SELLER: SUBMIT A NEW WITHDRAWAL REQUEST
     */
    @PostMapping("/request")
    public ResponseEntity<?> requestWithdrawal(@RequestBody Map<String, Double> payload, Principal principal) {
        User seller = getAuthenticatedSeller(principal);
        if (seller == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Hành động bị từ chối."));
        }

        Double amount = payload.get("amount");
        if (amount == null || amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền không hợp lệ."));
        }

        try {
            WithdrawalRequest request = withdrawalService.createWithdrawalRequest(seller.getId(), amount);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            log.error("Withdrawal error for seller {}: {}", seller.getId(), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 📜 FOR SELLER: GET WITHDRAWAL HISTORY
     */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Principal principal) {
        User seller = getAuthenticatedSeller(principal);
        if (seller == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<WithdrawalRequest> history = withdrawalService.getSellerHistory(seller.getId());
        return ResponseEntity.ok(history);
    }

    /**
     * 📊 ADMIN: GET ALL WITHDRAWAL REQUESTS FOR MANAGEMENT
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllRequests(Principal principal) {
        User admin = getAuthenticatedAdmin(principal);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Yêu cầu quyền Quản trị viên."));
        }

        return ResponseEntity.ok(withdrawalService.getAllRequests());
    }

    /**
     * ✅ ADMIN: PROCESS REQUEST (APPROVE/REJECT)
     * Finalizes the transaction and triggers the system notification.
     */
    @PutMapping("/admin/process/{requestId}")
    public ResponseEntity<?> processRequest(
            @PathVariable String requestId,
            @RequestBody Map<String, String> payload,
            Principal principal) {
        
        User admin = getAuthenticatedAdmin(principal);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String status = payload.get("status"); // Expected: COMPLETED or REJECTED
        String adminNote = payload.get("adminNote");

        try {
            WithdrawalRequest updated = withdrawalService.processRequest(requestId, status, adminNote);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}