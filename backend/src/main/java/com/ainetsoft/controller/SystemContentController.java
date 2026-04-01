package com.ainetsoft.controller;

import com.ainetsoft.model.SystemContent;
import com.ainetsoft.repository.SystemContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
public class SystemContentController {

    private final SystemContentRepository systemContentRepository;

    // --- 🌍 PUBLIC ENDPOINTS (No Login Required) ---

    /**
     * 🟢 FOR MODAL: Allows the LegalModal to fetch content.
     * Called by: api.get("/system-content/privacy")
     */
    @GetMapping("/api/system-content/{slug}")
    public ResponseEntity<SystemContent> getPublicContentBySlug(@PathVariable String slug) {
        return systemContentRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 🟢 FOR FOOTER: Aggregates company info and social links.
     * Called by: api.get("/system-content/footer")
     */
    @GetMapping("/api/system-content/footer")
    public ResponseEntity<Map<String, String>> getFooterInfo() {
        List<String> footerKeys = Arrays.asList(
            "footer_company_name", "footer_address", "footer_hotline",
            "footer_representative", "footer_tax_code", "footer_registration_date",
            "footer_issuing_agency", "footer_badge_1", "footer_badge_2", "footer_badge_3",
            "social_youtube", "social_facebook", "app_ios_link", "app_android_link", "app_qr_code"
        );

        List<SystemContent> contents = systemContentRepository.findBySlugIn(footerKeys);
        
        Map<String, String> footerMap = contents.stream()
                .collect(Collectors.toMap(
                    SystemContent::getSlug, 
                    SystemContent::getHtmlContent,
                    (existing, replacement) -> existing
                ));

        return ResponseEntity.ok(footerMap);
    }

    /**
     * 🟢 FOR APP BADGES: Bulk fetch for specific slugs.
     * Called by: api.get("/system-content/list?slugs=...")
     */
    @GetMapping("/api/system-content/list")
    public ResponseEntity<Map<String, String>> getMultipleContents(@RequestParam List<String> slugs) {
        List<SystemContent> contents = systemContentRepository.findBySlugIn(slugs);
        Map<String, String> resultMap = contents.stream()
                .collect(Collectors.toMap(
                        SystemContent::getSlug,
                        SystemContent::getHtmlContent,
                        (existing, replacement) -> existing
                ));
        return ResponseEntity.ok(resultMap);
    }

    // --- 🔐 ADMIN ENDPOINTS (Require ROLE_ADMIN) ---

    /**
     * List all for the Admin Sidebar.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/system-contents")
    public ResponseEntity<List<SystemContent>> getAllContents() {
        return ResponseEntity.ok(systemContentRepository.findAll());
    }

    /**
     * Fetch specific content for the Admin Editor.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/system-contents/{slug}")
    public ResponseEntity<SystemContent> getAdminContentBySlug(@PathVariable String slug) {
        return systemContentRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(new SystemContent(slug, "", ""))); 
    }

    /**
     * Save/Update from the Admin Editor.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/system-contents")
    public ResponseEntity<SystemContent> saveOrUpdate(@RequestBody SystemContent request) {
        SystemContent content = systemContentRepository.findBySlug(request.getSlug())
                .orElse(new SystemContent());

        content.setSlug(request.getSlug());
        content.setTitle(request.getTitle());
        content.setHtmlContent(request.getHtmlContent());
        content.setLastUpdated(LocalDateTime.now()); 

        SystemContent saved = systemContentRepository.save(content);
        return ResponseEntity.ok(saved);
    }
}