package com.ainetsoft.controller;

import com.ainetsoft.dto.*;
import com.ainetsoft.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityContextRepository securityContextRepository;

    /**
     * Gets current user info (including cart, addresses, and bank accounts).
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Phiên đăng nhập hết hạn");
        try {
            return ResponseEntity.ok(authService.getUserProfile(principal.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Updates profile info (Handles the Email Bridge for phone users).
     */
    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(@RequestBody UpdateProfileRequest request, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Phiên đăng nhập hết hạn");
        try {
            return ResponseEntity.ok(authService.updateProfile(principal.getName(), request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * NEW: Syncs the shopping cart from React to MongoDB.
     * Called whenever cart quantity or items change.
     */
    @PostMapping("/sync-cart")
    public ResponseEntity<String> syncCart(@RequestBody CartSyncRequest request, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        try {
            return ResponseEntity.ok(authService.syncCart(principal.getName(), request.getItems()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * NEW: Endpoint to handle the "Become a Seller" role upgrade.
     */
    @PostMapping("/upgrade-seller")
    public ResponseEntity<String> upgradeToSeller(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        try {
            return ResponseEntity.ok(authService.upgradeToSeller(principal.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordRequest request, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        try {
            return ResponseEntity.ok(authService.changePassword(principal.getName(), request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request, 
            HttpServletRequest servletRequest, 
            HttpServletResponse servletResponse) {
        try {
            LoginResponse response = authService.login(request);
            
            // Link the session context
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    request.getContactInfo(), 
                    null, 
                    null 
            );
            
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            
            securityContextRepository.saveContext(context, servletRequest, servletResponse);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            return ResponseEntity.ok(authService.processForgotPassword(request.get("contactInfo")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String contactInfo = request.get("contactInfo");
            String otp = request.get("otp");
            String newPassword = request.get("newPassword");
            return ResponseEntity.ok(authService.resetPassword(contactInfo, otp, newPassword));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}