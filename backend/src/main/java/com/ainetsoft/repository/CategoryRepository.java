package com.ainetsoft.repository;

import com.ainetsoft.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends MongoRepository<Category, String> {
    // Used by Sellers and Home Page
    List<Category> findByActiveTrue();
    
    // Check for duplicates
    boolean existsByName(String name);
}