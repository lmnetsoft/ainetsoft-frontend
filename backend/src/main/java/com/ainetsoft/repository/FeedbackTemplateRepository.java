package com.ainetsoft.repository;

import com.ainetsoft.model.FeedbackTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FeedbackTemplateRepository extends MongoRepository<FeedbackTemplate, String> {
    /**
     * Fetch templates filtered by type (e.g., only show Seller templates in Seller Moderation)
     */
    List<FeedbackTemplate> findByType(String type);
}