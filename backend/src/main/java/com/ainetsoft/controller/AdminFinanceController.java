package com.ainetsoft.controller;

import com.ainetsoft.model.PlatformConfig;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.PlatformConfigRepository;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/coins")
@RequiredArgsConstructor
public class AdminFinanceController {

    private final WalletService walletService;
    private final PlatformConfigRepository platformConfigRepository;
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

    @PostMapping("/config")
    public ResponseEntity<?> updateConfig(@RequestBody PlatformConfig configUpdate, Principal principal) {
        User admin = getAuthenticatedUser(principal);
        if (!isAdmin(admin)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));
        
        PlatformConfig config = platformConfigRepository.findAll().stream().findFirst().orElse(new PlatformConfig());
        config.setCashbackRate(configUpdate.getCashbackRate());
        config.setUpdatedAt(LocalDateTime.now());
        platformConfigRepository.save(config);
        return ResponseEntity.ok(Map.of("message", "Updated successfully", "config", config));
    }

    @PostMapping("/adjust")
    public ResponseEntity<?> adjustUserCoins(@RequestBody Map<String, Object> payload, Principal principal) {
        User admin = getAuthenticatedUser(principal);
        if (!isAdmin(admin)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));

        String userId = (String) payload.get("userId");
        double amount = Double.parseDouble(payload.get("amount").toString());
        String reason = (String) payload.get("reason");

        try {
            walletService.adjustUserCoins(userId, amount, reason, admin.getFullName());
            return ResponseEntity.ok(Map.of("message", "Điều chỉnh thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}