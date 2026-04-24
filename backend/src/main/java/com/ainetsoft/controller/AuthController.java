package com.ainetsoft.controller;

import com.ainetsoft.dto.*;
import com.ainetsoft.service.AuthService;
import com.ainetsoft.model.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j 
public class AuthController {

    private final AuthService authService;

    /**
     * GET /api/auth/me
     * Returns the full profile of the currently logged-in user.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        if (principal == null) {
            log.warn("GET /me called without a valid principal");
            throw new RuntimeException("Phiên đăng nhập hết hạn hoặc không hợp lệ");
        }
        
        try {
            return ResponseEntity.ok(authService.getUserProfile(principal.getName()));
        } catch (Exception e) {
            log.error("Error in GET /me for user {}: {}", principal.getName(), e.getMessage());
            throw new RuntimeException("Không thể tải thông tin cá nhân: " + e.getMessage());
        }
    }

    /**
     * 🛡️ OCR Verification endpoint for Identity Cards.
     */
    @PostMapping(value = "/verify-ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> verifyOCR(
            Principal principal, 
            @RequestPart("image") MultipartFile image) {
        
        if (principal == null) throw new RuntimeException("Unauthorized");
        
        log.info("OCR Verification requested by user: {}", principal.getName());
        
        try {
            return ResponseEntity.ok(authService.verifyOCR(image));
        } catch (Exception e) {
            log.error("OCR Error for {}: {}", principal.getName(), e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * GET /api/auth/verify-email
     */
    @GetMapping("/verify-email")
    public ResponseEntity<String> confirmEmail(@RequestParam("token") String token) {
        return ResponseEntity.ok(authService.confirmEmail(token));
    }

    /**
     * PUT /api/auth/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(@Valid @RequestBody UpdateProfileRequest request, Principal principal) {
        if (principal == null) throw new RuntimeException("Phiên đăng nhập hết hạn");
        return ResponseEntity.ok(authService.updateProfile(principal.getName(), request));
    }

    /**
     * 🛡️ UPDATED: PUT /api/auth/seller/settings
     * Now accepts both 'license' and 'logo' files from the frontend.
     */
    @PutMapping(value = "/seller/settings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateShopSettings(
            Principal principal,
            @RequestPart("data") ShopSettingsUpdateRequest request,
            @RequestPart(value = "license", required = false) MultipartFile license,
            @RequestPart(value = "logo", required = false) MultipartFile logo) { // 🚀 NEW: Added logo parameter
        
        if (principal == null) throw new RuntimeException("Unauthorized");
        
        try {
            // Forward both files and the request data to the AuthService
            User updatedUser = authService.updateShopSettings(principal.getName(), request, license, logo);
            return ResponseEntity.ok(Map.of(
                "message", "Cập nhật thiết lập Shop thành công!",
                "user", updatedUser
            ));
        } catch (Exception e) {
            log.error("Error updating shop settings for {}: {}", principal.getName(), e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * POST /api/auth/bank-account/update
     */
    @PostMapping("/bank-account/update")
    public ResponseEntity<?> updateBankAccount(Principal principal, @RequestBody BankAccountDTO request) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(authService.updateBankAccount(principal.getName(), request));
    }

    /**
     * GET /api/auth/public/shop/{slug}
     */
    @GetMapping("/public/shop/{slug}")
    public ResponseEntity<?> getShopBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(authService.getUserProfileBySlug(slug));
    }

    /**
     * POST /api/auth/sync-cart
     */
    @PostMapping("/sync-cart")
    public ResponseEntity<String> syncCart(@RequestBody CartSyncRequest request, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(authService.syncCart(principal.getName(), request.getItems()));
    }

    /**
     * POST /api/auth/upgrade-seller
     */
    @PostMapping(value = "/upgrade-seller", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> upgradeToSeller(
            Principal principal,
            @Valid @RequestPart("data") SellerRegistrationDTO registrationData,
            @RequestPart(value = "frontImage", required = false) MultipartFile frontImage,
            @RequestPart(value = "backImage", required = false) MultipartFile backImage,
            @RequestPart(value = "license", required = false) MultipartFile license) {
        
        if (principal == null) throw new RuntimeException("Unauthorized");
        
        log.info("Seller Upgrade Request - User: {} - BizType: {}", 
                 principal.getName(), registrationData.getBusinessType());
        
        return ResponseEntity.ok(authService.upgradeToSeller(
                principal.getName(), 
                registrationData, 
                frontImage, 
                backImage,
                license 
        ));
    }

    /**
     * POST /api/auth/change-password
     */
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(authService.changePassword(principal.getName(), request));
    }

    /**
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse loginResponse = authService.login(request);
        return ResponseEntity.ok(loginResponse);
    }

    /**
     * POST /api/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(authService.processForgotPassword(request.get("contactInfo")));
    }

    /**
     * POST /api/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        String contactInfo = request.get("contactInfo");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");
        return ResponseEntity.ok(authService.resetPassword(contactInfo, otp, newPassword));
    }

    /**
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công!"));
    }

    /**
     * POST /api/auth/favorite/{productId}
     */
    @PostMapping("/favorite/{productId}")
    public ResponseEntity<?> toggleFavorite(@PathVariable String productId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Vui lòng đăng nhập để yêu thích sản phẩm.");
        
        return ResponseEntity.ok(authService.toggleFavorite(productId, principal.getName()));
    }

// 🚀 NEW: Initiate Email Change verification
    @PostMapping("/initiate-email-change")
    public ResponseEntity<?> initiateEmailChange(@RequestBody EmailChangeRequest request) {
        try {
            String message = authService.initiateEmailChange(request.getCurrentContact(), request.getNewEmail());
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 🚀 NEW: Confirm Email Change verification
    @PostMapping("/confirm-email-change")
    public ResponseEntity<?> confirmEmailChange(@RequestBody EmailChangeRequest request) {
        try {
            String message = authService.confirmEmailChange(
                request.getCurrentContact(), 
                request.getNewEmail(), 
                request.getOtp()
            );
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }    

   @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        // 🚀 Standardized to "phone"
        String phone = request.get("phone");
        if (phone == null || phone.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại là bắt buộc"));
        }
        authService.generateAndSendOtp(phone); 
        return ResponseEntity.ok(Map.of("message", "Mã xác minh đã được gửi!"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        // 🚀 CHANGED FROM "phoneNumber" TO "phone" TO MATCH
        String phone = request.get("phone");
        String code = request.get("code");
        
        boolean isValid = authService.verifyOtp(phone, code);
        if (isValid) {
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Mã xác nhận không chính xác hoặc đã hết hạn"));
    }
}