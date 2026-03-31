package com.ainetsoft.controller;

import com.ainetsoft.model.SystemContent;
import com.ainetsoft.repository.SystemContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public Controller for retrieving system content.
 * Accessible by all users to read legal documents (Privacy, Terms, etc.).
 */
@RestController
@RequestMapping("/api/system-content")
@RequiredArgsConstructor
public class SystemContentController {

    private final SystemContentRepository systemContentRepository;

    /**
     * Public GET endpoint to fetch a content page by its slug.
     * Usage: GET /api/system-content/privacy
     */
    @GetMapping("/{slug}")
    public ResponseEntity<SystemContent> getContentBySlug(@PathVariable String slug) {
        return systemContentRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}