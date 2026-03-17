package com.ainetsoft.controller;

import com.ainetsoft.dto.*;
import com.ainetsoft.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
     * PUT /api/auth/profile
     * Updates user details like name, email, phone, and addresses.
     */
    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(@Valid @RequestBody UpdateProfileRequest request, Principal principal) {
        if (principal == null) throw new RuntimeException("Phiên đăng nhập hết hạn");
        return ResponseEntity.ok(authService.updateProfile(principal.getName(), request));
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
     * UPDATED: Handles Multi-part data for CCCD images and Shop/Bank details.
     * Maps to the frontend FormData logic.
     */
    @PostMapping(value = "/upgrade-seller", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> upgradeToSeller(
            Principal principal,
            @RequestPart("data") SellerRegistrationDTO registrationData,
            @RequestPart(value = "frontImage", required = false) MultipartFile frontImage,
            @RequestPart(value = "backImage", required = false) MultipartFile backImage) {
        
        if (principal == null) throw new RuntimeException("Unauthorized");
        
        log.info("Received seller upgrade request for: {}", principal.getName());
        
        return ResponseEntity.ok(authService.upgradeToSeller(
                principal.getName(), 
                registrationData, 
                frontImage, 
                backImage
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

    @PostMapping("/favorite/{productId}")
    public ResponseEntity<?> toggleFavorite(@PathVariable String productId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Vui lòng đăng nhập để yêu thích sản phẩm.");
        
        return ResponseEntity.ok(authService.toggleFavorite(productId, principal.getName()));
    }
}