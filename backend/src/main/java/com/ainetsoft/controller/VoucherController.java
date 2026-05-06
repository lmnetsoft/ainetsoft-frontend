package com.ainetsoft.controller;

import com.ainetsoft.model.User;
import com.ainetsoft.model.Voucher;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.VoucherRepository; // 🚀 BỔ SUNG: Import Repository
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
    private final VoucherRepository voucherRepository; // 🚀 BỔ SUNG: Inject Repository để tìm kiếm mã

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

    // 🚀 TÍNH NĂNG MỚI: TÌM KIẾM VOUCHER BẰNG MÃ NHẬP TAY (SHOPEE STYLE)
    @GetMapping("/code/{code}")
    public ResponseEntity<?> getVoucherByCode(@PathVariable String code) {
        try {
            // Lấy voucher từ database dựa trên code (Không phân biệt hoa thường)
            Voucher voucher = voucherRepository.findAll().stream()
                .filter(v -> v.getCode() != null && v.getCode().equalsIgnoreCase(code.trim()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Mã Voucher không tồn tại!"));

            // Kiểm tra tính hợp lệ (Active, Thời gian, Số lượt dùng)
            if (!voucher.isActive() || 
                java.time.LocalDateTime.now().isBefore(voucher.getValidFrom()) || 
                java.time.LocalDateTime.now().isAfter(voucher.getValidUntil())) {
                throw new RuntimeException("Mã Voucher đã hết hạn hoặc chưa có hiệu lực!");
            }
            if (voucher.getUsedCount() >= voucher.getUsageLimit()) {
                throw new RuntimeException("Mã Voucher này đã hết lượt sử dụng!");
            }

            return ResponseEntity.ok(voucher);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ==========================================
    // 🛒 BUYER ENDPOINTS (NGƯỜI MUA QUẢN LÝ VÍ VOUCHER)
    // ==========================================

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

    // ==========================================
    // 👑 ADMIN ENDPOINTS (QUẢN LÝ VOUCHER TOÀN SÀN)
    // ==========================================

    @GetMapping("/admin/platform")
    public ResponseEntity<?> getAllPlatformVouchers(Principal principal) {
        User admin = getAuthenticatedUser(principal);
        if (!hasRole(admin, "ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Chỉ Admin mới có quyền truy cập."));
        }
        return ResponseEntity.ok(voucherService.getAllPlatformVouchers());
    }

    @PostMapping("/admin/platform")
    public ResponseEntity<?> createPlatformVoucher(@RequestBody Voucher voucherPayload, Principal principal) {
        User admin = getAuthenticatedUser(principal);
        if (!hasRole(admin, "ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Chỉ Admin mới có quyền tạo mã toàn sàn."));
        }
        try {
            voucherPayload.setSellerId(null); 
            voucherPayload.setShopName("AiNetsoft Platform");
            Voucher created = voucherService.createVoucher(voucherPayload);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/admin/platform/{id}/deactivate")
    public ResponseEntity<?> deactivatePlatformVoucher(@PathVariable String id, Principal principal) {
        User admin = getAuthenticatedUser(principal);
        if (!hasRole(admin, "ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Chỉ Admin mới có quyền khóa mã toàn sàn."));
        }
        try {
            Voucher deactivated = voucherService.deactivatePlatformVoucher(id);
            return ResponseEntity.ok(Map.of("message", "Đã khóa mã voucher toàn sàn", "voucher", deactivated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}