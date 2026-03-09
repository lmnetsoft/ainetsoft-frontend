package com.ainetsoft.repository;

import com.ainetsoft.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    Boolean existsByEmail(String email);
    Boolean existsByPhone(String phone);

    /**
     * Counts users who have a specific role in their roles set.
     */
    long countByRolesContaining(String role);

    @Query("{ '$or': [ { 'email': ?0 }, { 'phone': ?0 } ] }")
    Optional<User> findByIdentifier(String identifier);

    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
}