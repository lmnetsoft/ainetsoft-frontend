package com.ainetsoft.repository;

import com.ainetsoft.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    // Check if email already exists for registration validation
    Optional<User> findByEmail(String email);
    
    // Check if phone already exists for registration validation
    Optional<User> findByPhone(String phone);
    
    // Useful for checking existence without loading the whole object
    Boolean existsByEmail(String email);
    Boolean existsByPhone(String phone);
}