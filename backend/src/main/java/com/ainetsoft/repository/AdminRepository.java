package com.ainetsoft.repository;

import com.ainetsoft.model.User;
import com.ainetsoft.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * NEW: Dedicated Admin Repository
 * Handles specialized queries for marketplace moderation.
 */
@Repository
public interface AdminRepository extends MongoRepository<User, String> {
    
    // --- SELLER MODERATION ---
    // Finds users who have requested an upgrade but are not yet verified
    List<User> findBySellerVerification(String sellerVerification);

    // --- USER MODERATION ---
    // Allows admin to list all blocked or active accounts
    List<User> findByAccountStatus(String accountStatus);

    // --- SEARCH HELPERS ---
    // Finds users by their role (e.g., list all users with ROLE_ADMIN)
    List<User> findByRolesContaining(String role);
}