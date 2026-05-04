package com.ainetsoft.controller;

import com.ainetsoft.model.User;
import com.ainetsoft.model.Voucher;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.VoucherService;
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
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName()).orElse(null);
    }

    private boolean hasRole(User user, String roleName) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().contains(roleName) || user.getRoles().contains("ROLE_" + roleName);
    }

    // ==========================================
    // 🚀 PUBLIC ENDPOINTS (CHO NGƯỜI MUA XEM VOUCHER)
    // ==========================================

    @GetMapping("/public/shop/{sellerId}")
    public ResponseEntity<?> getShopActiveVouchers(@PathVariable String sellerId) {
        return ResponseEntity.ok(voucherService.getActiveVouchersByShop(sellerId));
    }

    @GetMapping("/public/platform")
    public ResponseEntity<?> getPlatformActiveVouchers() {
        return ResponseEntity.ok(voucherService.getActivePlatformVouchers());
    }

    // ==========================================
    // 🛒 BUYER ENDPOINTS (NGƯỜI MUA QUẢN LÝ VÍ VOUCHER)
    // ==========================================

    // 🚀 API LƯU VOUCHER VÀO VÍ
    @PostMapping("/save/{voucherId}")
    public ResponseEntity<?> saveVoucherToWallet(@PathVariable String voucherId, Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập để lưu mã."));
        }
        try {
            voucherService.saveVoucherToWallet(voucherId, user.getId());
            return ResponseEntity.ok(Map.of("message", "Đã lưu mã giảm giá vào ví thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 🚀 API LẤY DANH SÁCH VOUCHER TRONG VÍ
    @GetMapping("/my-wallet")
    public ResponseEntity<?> getMySavedVouchers(Principal principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập."));
        }
        try {
            List<Voucher> myVouchers = voucherService.getMySavedVouchers(user.getId());
            return ResponseEntity.ok(myVouchers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ==========================================
    // 🏪 SELLER ENDPOINTS (QUẢN LÝ VOUCHER)
    // ==========================================

    @GetMapping("/seller/my-vouchers")
    public ResponseEntity<?> getMyVouchers(Principal principal) {
        User seller = getAuthenticatedUser(principal);
        if (!hasRole(seller, "SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Chỉ Người bán mới có quyền truy cập kênh này."));
        }
        return ResponseEntity.ok(voucherService.getSellerVouchers(seller.getId()));
    }

    @PostMapping("/seller/create")
    public ResponseEntity<?> createVoucher(@RequestBody Voucher voucherPayload, Principal principal) {
        User seller = getAuthenticatedUser(principal);
        if (!hasRole(seller, "SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Chỉ Người bán mới có quyền tạo mã giảm giá."));
        }

        try {
            voucherPayload.setSellerId(seller.getId());
            
            String finalShopName = seller.getEmail(); 
            if (seller.getShopProfile() != null && seller.getShopProfile().getShopName() != null) {
                finalShopName = seller.getShopProfile().getShopName();
            } else if (seller.getFullName() != null) {
                finalShopName = seller.getFullName();
            }
            voucherPayload.setShopName(finalShopName);
            
            Voucher createdVoucher = voucherService.createVoucher(voucherPayload);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdVoucher);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/seller/deactivate/{id}")
    public ResponseEntity<?> deactivateVoucher(@PathVariable String id, Principal principal) {
        User seller = getAuthenticatedUser(principal);
        if (!hasRole(seller, "SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Chỉ Người bán mới có quyền thực hiện thao tác này."));
        }

        try {
            Voucher deactivated = voucherService.deactivateVoucher(id, seller.getId());
            return ResponseEntity.ok(Map.of("message", "Đã kết thúc voucher thành công", "voucher", deactivated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}