package com.ainetsoft.controller;

import com.ainetsoft.model.User;
import com.ainetsoft.model.Voucher;
import com.ainetsoft.model.Wallet;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName()).orElse(null);
    }

    // 1. Lấy thông tin Ví hiện tại (Số dư Xu & ID Voucher)
    @GetMapping("/me")
    public ResponseEntity<?> getMyWallet(Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Wallet wallet = walletService.getOrCreateWallet(user.getId());
        return ResponseEntity.ok(wallet);
    }

    // 2. Lấy danh sách CHI TIẾT các Voucher đã lưu
    @GetMapping("/me/vouchers")
    public ResponseEntity<?> getMySavedVouchers(Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Voucher> vouchers = walletService.getSavedVouchersDetailed(user.getId());
        return ResponseEntity.ok(vouchers);
    }

    // 3. Lưu một Voucher mới vào Kho
    @PostMapping("/me/vouchers/{voucherId}")
    public ResponseEntity<?> saveVoucher(@PathVariable String voucherId, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            Wallet updatedWallet = walletService.saveVoucherToWallet(user.getId(), voucherId);
            return ResponseEntity.ok(Map.of("message", "Lưu voucher thành công!", "wallet", updatedWallet));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 4. Xóa một Voucher khỏi Kho
    @DeleteMapping("/me/vouchers/{voucherId}")
    public ResponseEntity<?> removeVoucher(@PathVariable String voucherId, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Wallet updatedWallet = walletService.removeVoucherFromWallet(user.getId(), voucherId);
        return ResponseEntity.ok(Map.of("message", "Đã bỏ lưu voucher.", "wallet", updatedWallet));
    }
}