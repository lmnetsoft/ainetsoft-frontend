package com.ainetsoft.controller;

import com.ainetsoft.dto.*;
import com.ainetsoft.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * GET /api/auth/me
     * Returns the full profile of the currently logged-in user.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        if (principal == null) throw new RuntimeException("Phiên đăng nhập hết hạn");
        return ResponseEntity.ok(authService.getUserProfile(principal.getName()));
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
     * Saves the guest cart items to the user's account in MongoDB.
     */
    @PostMapping("/sync-cart")
    public ResponseEntity<String> syncCart(@RequestBody CartSyncRequest request, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(authService.syncCart(principal.getName(), request.getItems()));
    }

    /**
     * POST /api/auth/upgrade-seller
     * Submits a request or instantly upgrades a user to ROLE_SELLER.
     */
    @PostMapping("/upgrade-seller")
    public ResponseEntity<String> upgradeToSeller(Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(authService.upgradeToSeller(principal.getName()));
    }

    /**
     * POST /api/auth/change-password
     * Allows a logged-in user to update their password.
     */
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(authService.changePassword(principal.getName(), request));
    }

    /**
     * POST /api/auth/register
     * Public endpoint to create a new account.
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * POST /api/auth/login
     * UPDATED: Now returns a JWT token. 
     * We removed the manual SecurityContextRepository saving to support Stateless mode.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        // AuthService now handles credential check AND token generation
        LoginResponse loginResponse = authService.login(request);
        return ResponseEntity.ok(loginResponse);
    }

    /**
     * POST /api/auth/forgot-password
     * Initiates the OTP process for password recovery.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(authService.processForgotPassword(request.get("contactInfo")));
    }

    /**
     * POST /api/auth/reset-password
     * Verifies the OTP and sets the new password.
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
     * Simply returns a success message. 
     * The actual session cleanup is handled by SecurityConfig and the Frontend.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công!"));
    }
}