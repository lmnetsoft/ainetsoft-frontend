package com.ainetsoft.controller;

import com.ainetsoft.dto.RegisterRequest;
import com.ainetsoft.dto.LoginRequest;
import com.ainetsoft.dto.LoginResponse;
import com.ainetsoft.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Endpoint for user registration.
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        try {
            String message = authService.register(request);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Endpoint for user login.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    /**
     * NEW Phase 1: Request OTP for password recovery.
     * Expects a JSON like: { "contactInfo": "user@example.com" }
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String contactInfo = request.get("contactInfo");
            String message = authService.processForgotPassword(contactInfo);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * NEW Phase 2: Verify OTP and reset password.
     * Expects a JSON like: { "contactInfo": "...", "otp": "123456", "newPassword": "..." }
     */
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String contactInfo = request.get("contactInfo");
            String otp = request.get("otp");
            String newPassword = request.get("newPassword");
            
            String message = authService.resetPassword(contactInfo, otp, newPassword);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}