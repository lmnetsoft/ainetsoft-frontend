package com.ainetsoft.repository;

import com.ainetsoft.model.SystemContent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query; // 🚀 New Import
import java.util.Optional;
import java.util.List;
import java.util.Collection;

public interface SystemContentRepository extends MongoRepository<SystemContent, String> {
    
    Optional<SystemContent> findBySlug(String slug);
    
    boolean existsBySlug(String slug);

    List<SystemContent> findBySlugIn(Collection<String> slugs);

    /**
     * 🚀 PRODUCTION FULL-TEXT SEARCH
     * Uses MongoDB $text operator. Matches in titles (weighted 3x) will 
     * appear higher than matches in the body content.
     */
    @Query("{ $text: { $search: ?0 } }")
    List<SystemContent> searchArticles(String keyword);

    /**
     * ⚡ AUTOCOMPLETE SUGGESTIONS
     * Fast search by title only for the search bar dropdown.
     */
    List<SystemContent> findByTitleContainingIgnoreCase(String title);
}