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
     * Finds user by Email, Phone, OR their MongoDB ID.
     * Use this in the AuthService to ensure Principal matches work correctly.
     */
    @Query("{ '$or': [ { 'email': ?0 }, { 'phone': ?0 }, { '_id': ?0 } ] }")
    Optional<User> findByIdentifier(String identifier);

    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
}