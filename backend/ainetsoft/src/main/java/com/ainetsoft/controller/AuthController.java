package com.ainetsoft.controller;

import com.ainetsoft.dto.RegisterRequest;
import com.ainetsoft.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        try {
            String message = authService.register(request);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            // Returns a 400 Bad Request with the custom error message (e.g., "Email exists")
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}