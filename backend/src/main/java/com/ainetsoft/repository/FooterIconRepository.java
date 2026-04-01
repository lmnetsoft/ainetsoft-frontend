package com.ainetsoft.repository;

import com.ainetsoft.model.FooterIcon;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FooterIconRepository extends MongoRepository<FooterIcon, String> {
    List<FooterIcon> findByCategoryOrderByDisplayOrderAsc(String category);
}