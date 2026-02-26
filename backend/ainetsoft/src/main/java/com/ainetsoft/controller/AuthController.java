package com.ainetsoft.controller;

import com.ainetsoft.dto.RegisterRequest;
import com.ainetsoft.dto.LoginRequest; // CRITICAL: Fixes the compilation error
import com.ainetsoft.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Endpoint for user registration.
     * Returns 200 OK on success, or 400 Bad Request if validation fails.
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        try {
            String message = authService.register(request);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            // Sends back custom messages like "Email này đã được sử dụng!"
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Endpoint for user login.
     * Returns 200 OK on success, or 401 Unauthorized if credentials are wrong.
     */
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        try {
            String message = authService.login(request);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            // 401 Unauthorized is standard for failed logins
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}