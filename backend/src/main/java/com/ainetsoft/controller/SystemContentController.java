package com.ainetsoft.controller;

import com.ainetsoft.model.SystemContent;
import com.ainetsoft.repository.SystemContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/system-content")
@RequiredArgsConstructor
public class SystemContentController {

    private final SystemContentRepository systemContentRepository;

    @GetMapping("/{slug}")
    public ResponseEntity<SystemContent> getContentBySlug(@PathVariable String slug) {
        return systemContentRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 🚀 NEW: Public endpoint for the Footer.
     * Aggregates company info and social links into a single object.
     */
    @GetMapping("/footer")
    public ResponseEntity<Map<String, String>> getFooterInfo() {
        List<String> footerKeys = Arrays.asList(
            "footer_company_name", 
            "footer_address", 
            "footer_hotline",
            "footer_representative", 
            "footer_tax_code", 
            "footer_registration_date",
            "footer_issuing_agency",
            "footer_badge_1",
            "footer_badge_2",
            "footer_badge_3",
            "social_youtube", 
            "social_facebook"
        );

        List<SystemContent> contents = systemContentRepository.findBySlugIn(footerKeys);
        
        // Convert list to a simple Key-Value map for the frontend
        Map<String, String> footerMap = contents.stream()
                .collect(Collectors.toMap(
                    SystemContent::getSlug, 
                    SystemContent::getHtmlContent,
                    (existing, replacement) -> existing // Handle potential duplicates
                ));

        return ResponseEntity.ok(footerMap);
    }
}