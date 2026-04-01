package com.ainetsoft.repository;

import com.ainetsoft.model.SystemContent;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.List;
import java.util.Collection;

public interface SystemContentRepository extends MongoRepository<SystemContent, String> {
    
    Optional<SystemContent> findBySlug(String slug);
    
    boolean existsBySlug(String slug);

    /**
     * 🚀 NEW: Fetch all content matching a list of slugs.
     * Used to get all footer fields (address, tax code, social links) in one query.
     */
    List<SystemContent> findBySlugIn(Collection<String> slugs);
}