package com.ainetsoft.controller;

import com.ainetsoft.dto.AdminStatsSummary;
import com.ainetsoft.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // ADD THIS
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // FIXED: Locked this down to match AdminController
public class AdminStatsController {

    private final AdminService adminService;

    @GetMapping("/summary")
    public ResponseEntity<AdminStatsSummary> getSummary() {
        // Now synchronized with the Security Filter
        return ResponseEntity.ok(adminService.getGlobalStats());
    }
}