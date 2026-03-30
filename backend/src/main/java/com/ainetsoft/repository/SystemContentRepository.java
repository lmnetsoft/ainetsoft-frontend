package com.ainetsoft.repository;

import com.ainetsoft.model.SystemContent;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface SystemContentRepository extends MongoRepository<SystemContent, String> {
    
    /**
     * Finds a dynamic content page by its slug (e.g., "privacy", "terms", "regulations").
     * Used by the unified ContentPage.tsx component.
     */
    Optional<SystemContent> findBySlug(String slug);
    
    /**
     * Checks if a content slug already exists.
     */
    boolean existsBySlug(String slug);
}