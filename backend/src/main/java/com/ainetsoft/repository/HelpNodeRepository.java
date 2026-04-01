package com.ainetsoft.repository;

import com.ainetsoft.model.HelpNode;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface HelpNodeRepository extends MongoRepository<HelpNode, String> {
    List<HelpNode> findAllByOrderByDisplayOrderAsc();
    List<HelpNode> findByParentIdOrderByDisplayOrderAsc(String parentId);
}