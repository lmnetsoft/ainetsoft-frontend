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
@CrossOrigin(origins = "*")
public class SystemContentController {

    private final SystemContentRepository systemContentRepository;

    // --- 🌍 PUBLIC ENDPOINTS (No Login Required) ---

    /**
     * 🔍 NEW: Full-Text Search for Help Articles
     * Use this when the user is in the Help Center.
     */
    @GetMapping("/api/system-content/search")
    public ResponseEntity<List<SystemContent>> searchHelpArticles(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        // Returns results sorted by relevance (Title matches higher than body)
        return ResponseEntity.ok(systemContentRepository.searchArticles(q));
    }

    /**
     * ⚡ NEW: Search Suggestions (Autocomplete)
     * Use this for the dropdown list while the user types.
     */
    @GetMapping("/api/system-content/suggestions")
    public ResponseEntity<List<SystemContent>> getSearchSuggestions(@RequestParam String q) {
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(systemContentRepository.findByTitleContainingIgnoreCase(q));
    }

    @GetMapping("/api/system-content/{slug}")
    public ResponseEntity<SystemContent> getPublicContentBySlug(@PathVariable String slug) {
        return systemContentRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

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

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/system-contents")
    public ResponseEntity<List<SystemContent>> getAllContents() {
        return ResponseEntity.ok(systemContentRepository.findAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/system-contents/{slug}")
    public ResponseEntity<SystemContent> getAdminContentBySlug(@PathVariable String slug) {
        return systemContentRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(new SystemContent(slug, "", ""))); 
    }

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

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/system-contents/{slug}")
    public ResponseEntity<Void> deleteContent(@PathVariable String slug) {
        return systemContentRepository.findBySlug(slug)
            .map(content -> {
                systemContentRepository.delete(content);
                return ResponseEntity.noContent().<Void>build();
            })
            .orElse(ResponseEntity.notFound().build());
    }    
}