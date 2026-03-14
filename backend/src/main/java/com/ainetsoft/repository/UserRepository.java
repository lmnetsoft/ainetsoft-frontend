package com.ainetsoft.repository;

import com.ainetsoft.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    Boolean existsByEmail(String email);
    Boolean existsByPhone(String phone);

    /**
     * Counts users who have a specific role in their roles set.
     */
    long countByRolesContaining(String role);

    /**
     * FIXED SOURCE OF TRUTH: Query by sellerVerification.
     * This is what shows the "1" on your dashboard card for Bestseller.
     */
    long countBySellerVerification(String status);

    /**
     * FIXED SOURCE OF TRUTH: Find the list of users for the "Duyệt Shop" table.
     */
    List<User> findBySellerVerification(String status);

    /**
     * KEPT: Counts users by their specific account status.
     * (e.g., ACTIVE, BANNED, PENDING_SELLER)
     */
    long countByAccountStatus(String accountStatus);

    /**
     * KEPT: Finds the actual list of users by status.
     */
    List<User> findByAccountStatus(String accountStatus);

    /**
     * FIND BY IDENTIFIER
     * UPDATED: Uses a regex-based case-insensitive match.
     */
    @Query("{ '$or': [ { 'email': { $regex: '^?0$', $options: 'i' } }, { 'phone': ?0 } ] }")
    Optional<User> findByIdentifier(String identifier);

    /**
     * Robust lookup by email with case-insensitivity.
     */
    @Query("{ 'email': { $regex: '^?0$', $options: 'i' } }")
    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    /**
     * Added for Social Login stability: Find user by their social provider ID.
     */
    Optional<User> findByProviderId(String providerId);
}