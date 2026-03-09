package com.ainetsoft.controller;

import com.ainetsoft.dto.AdminStatsSummary;
import com.ainetsoft.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final AdminService adminService;

    @GetMapping("/summary")
    public ResponseEntity<AdminStatsSummary> getSummary() {
        // This will now work because adminService.getGlobalStats() returns AdminStatsSummary
        return ResponseEntity.ok(adminService.getGlobalStats());
    }
}