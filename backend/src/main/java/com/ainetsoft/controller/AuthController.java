package com.ainetsoft.controller;

import com.ainetsoft.dto.*;
import com.ainetsoft.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority; // Added
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.stream.Collectors; // Added

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityContextRepository securityContextRepository;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        if (principal == null) throw new RuntimeException("Phiên đăng nhập hết hạn");
        return ResponseEntity.ok(authService.getUserProfile(principal.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(@Valid @RequestBody UpdateProfileRequest request, Principal principal) {
        if (principal == null) throw new RuntimeException("Phiên đăng nhập hết hạn");
        return ResponseEntity.ok(authService.updateProfile(principal.getName(), request));
    }

    @PostMapping("/sync-cart")
    public ResponseEntity<String> syncCart(@RequestBody CartSyncRequest request, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(authService.syncCart(principal.getName(), request.getItems()));
    }

    @PostMapping("/upgrade-seller")
    public ResponseEntity<String> upgradeToSeller(Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(authService.upgradeToSeller(principal.getName()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request, Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(authService.changePassword(principal.getName(), request));
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request, 
            HttpServletRequest servletRequest, 
            HttpServletResponse servletResponse) {
        
        // 1. Authenticate via service
        LoginResponse loginResponse = authService.login(request);
        
        // 2. FIX: Convert String roles to GrantedAuthority objects
        var authorities = loginResponse.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());

        // 3. Create full Authentication object with authorities
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                request.getContactInfo(), 
                null, 
                authorities 
        );
        
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        
        // 4. Persist the context in the session
        securityContextRepository.saveContext(context, servletRequest, servletResponse);

        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(authService.processForgotPassword(request.get("contactInfo")));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        String contactInfo = request.get("contactInfo");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");
        return ResponseEntity.ok(authService.resetPassword(contactInfo, otp, newPassword));
    }
}