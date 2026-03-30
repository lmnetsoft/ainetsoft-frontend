package com.ainetsoft.controller;

import com.ainetsoft.dto.AdminStatsSummary;
import com.ainetsoft.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AdminStatsController - Dedicated to dashboard metrics.
 * Optimized for Shopee-like stats (Users, Sellers, Products, Revenue).
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/stats") // Path synchronized with SecurityConfig & admin.service.ts
@RequiredArgsConstructor
public class AdminStatsController {

    private final AdminService adminService;

    /**
     * Requirement: Fetch high-level statistics for the admin dashboard cards.
     * Synchronized with AdminStatsSummary DTO.
     */
    @GetMapping("/summary")
    /* * FIX: Changed hasAuthority('ADMIN') to hasRole('ADMIN').
     * CustomUserDetailsService prefixes DB roles with 'ROLE_'.
     * hasRole('ADMIN') automatically looks for 'ROLE_ADMIN' in the security context.
     */
    @PreAuthorize("hasRole('ADMIN')") 
    public ResponseEntity<AdminStatsSummary> getSummary() {
        log.info("[ADMIN API] --- Dashboard stats sync initiated ---");
        
        AdminStatsSummary stats = adminService.getGlobalStats();
        
        log.info("[ADMIN API] Success: Users: {}, Products: {}, Revenue: {}", 
                stats.getTotalUsers(), stats.getTotalProducts(), stats.getTotalRevenue());
                
        return ResponseEntity.ok(stats);
    }
}