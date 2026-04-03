package com.ainetsoft.repository;

import com.ainetsoft.model.ContentNode;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ContentNodeRepository extends MongoRepository<ContentNode, String> {

    /**
     * Loads the entire structure ordered by display preference.
     */
    List<ContentNode> findAllByOrderByDisplayOrderAsc();

    /**
     * Fetches sub-pages for a specific category.
     */
    List<ContentNode> findByParentIdOrderByDisplayOrderAsc(String parentId);

    /**
     * Cascading delete: removes all children belonging to a parent ID.
     */
    void deleteByParentId(String parentId);
}