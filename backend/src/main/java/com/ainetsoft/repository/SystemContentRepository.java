package com.ainetsoft.repository;

import com.ainetsoft.model.SystemContent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query; 
import java.util.Optional;
import java.util.List;
import java.util.Collection;

public interface SystemContentRepository extends MongoRepository<SystemContent, String> {
    
    Optional<SystemContent> findBySlug(String slug);
    
    boolean existsBySlug(String slug);

    List<SystemContent> findBySlugIn(Collection<String> slugs);

    /**
     * 🚀 PRODUCTION FULL-TEXT SEARCH (100% ORIGINAL)
     * Uses MongoDB $text operator. Matches in titles (weighted 3x) will 
     * appear higher than matches in the body content.
     */
    @Query("{ $text: { $search: ?0 } }")
    List<SystemContent> searchArticles(String keyword);

    /**
     * ⚡ AUTOCOMPLETE SUGGESTIONS (100% ORIGINAL)
     * Fast search by title only for the search bar dropdown.
     */
    List<SystemContent> findByTitleContainingIgnoreCase(String title);

    // --- 🚀 PHASE 5 APPENDS: SYSTEM GOVERNANCE & CMS SUPPORT ---

    /**
     * PHASE 5: Fetch content by category.
     * Essential for grouping content like "Legal", "Help", or "FAQs" in the CMS.
     */
    List<SystemContent> findByCategory(String category);

    /**
     * PHASE 5: Public Filter.
     * Ensures that 'Draft' content (isActive = false) is not leaked to the public API.
     */
    List<SystemContent> findAllByIsActiveTrue();

    /**
     * PHASE 5: Governance Lookup.
     * Finds content by category and status for admin moderation views.
     */
    List<SystemContent> findByCategoryAndIsActive(String category, boolean isActive);
}