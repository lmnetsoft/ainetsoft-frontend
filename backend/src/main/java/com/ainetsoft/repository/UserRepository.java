package com.ainetsoft.repository;

import com.ainetsoft.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    
    /**
     * Used for registration validation to check if email/phone are taken.
     */
    Boolean existsByEmail(String email);
    Boolean existsByPhone(String phone);
    
    /**
     * Used for login to find the user by either their email or phone number.
     * The AuthService will pass the same 'contactInfo' to both parameters.
     */
    Optional<User> findByEmailOrPhone(String email, String phone);

    /**
     * Optional: Still useful if you need to fetch a user specifically by one field later.
     */
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
}