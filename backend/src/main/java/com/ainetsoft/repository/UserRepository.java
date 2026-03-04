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
     * THE FIX: This query ensures that the normalized string hit 
     * either the email or the phone field. 
     * * Note: Searching by '_id' inside a String-based $or query usually 
     * requires the input to be a valid hex string for MongoDB's ObjectId.
     */
    @Query("{ '$or': [ { 'email': ?0 }, { 'phone': ?0 } ] }")
    Optional<User> findByIdentifier(String identifier);

    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
}