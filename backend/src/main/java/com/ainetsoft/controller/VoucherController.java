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

    // --- Helper function: Lấy User đang đăng nhập ---
    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName()).orElse(null);
    }

    // --- Helper function: Kiểm tra Quyền (Role) ---
    private boolean hasRole(User user, String roleName) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().contains(roleName) || user.getRoles().contains("ROLE_" + roleName);
    }

    // 1. Lấy danh sách Voucher của Người bán
    @GetMapping("/seller/my-vouchers")
    public ResponseEntity<?> getMyVouchers(Principal principal) {
        User seller = getAuthenticatedUser(principal);
        
        if (!hasRole(seller, "SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Chỉ Người bán mới có quyền truy cập kênh này."));
        }

        List<Voucher> vouchers = voucherService.getSellerVouchers(seller.getId());
        return ResponseEntity.ok(vouchers);
    }

    // 2. Người bán Tạo Voucher mới
    @PostMapping("/seller/create")
    public ResponseEntity<?> createVoucher(@RequestBody Voucher voucherPayload, Principal principal) {
        User seller = getAuthenticatedUser(principal);
        
        if (!hasRole(seller, "SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Chỉ Người bán mới có quyền tạo mã giảm giá."));
        }

        try {
            // Gắn thông tin chủ sở hữu vào Voucher
            voucherPayload.setSellerId(seller.getId());
            // Sử dụng tên Shop hoặc tên đầy đủ của người bán
            voucherPayload.setShopName(seller.getFullName() != null ? seller.getFullName() : "Shop " + seller.getUsername());
            
            Voucher createdVoucher = voucherService.createVoucher(voucherPayload);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdVoucher);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 3. Người bán kết thúc sớm (Vô hiệu hóa) Voucher
    @PutMapping("/seller/deactivate/{id}")
    public ResponseEntity<?> deactivateVoucher(@PathVariable String id, Principal principal) {
        User seller = getAuthenticatedUser(principal);
        
        if (!hasRole(seller, "SELLER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Chỉ Người bán mới có quyền thực hiện thao tác này."));
        }

        try {
            Voucher deactivated = voucherService.deactivateVoucher(id, seller.getId());
            return ResponseEntity.ok(Map.of(
                    "message", "Đã kết thúc voucher thành công", 
                    "voucher", deactivated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}