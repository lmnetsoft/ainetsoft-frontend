package com.ainetsoft.controller;

import com.ainetsoft.model.ReportReason;
import com.ainetsoft.repository.ReportReasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/report-reasons")
@RequiredArgsConstructor
public class ReportReasonController {

    private final ReportReasonRepository repository;

    /**
     * PUBLIC: Used by users in the "Tố cáo" modal on ProductDetail.tsx
     */
    @GetMapping
    public List<ReportReason> getAllActive() {
        return repository.findByActiveTrue();
    }

    /**
     * ADMIN: Add or Update a reason
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/save")
    public ResponseEntity<ReportReason> saveReason(@RequestBody ReportReason reason) {
        return ResponseEntity.ok(repository.save(reason));
    }

    /**
     * ADMIN: Permanent delete
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa danh mục vi phạm."));
    }
}