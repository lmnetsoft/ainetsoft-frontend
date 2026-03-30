package com.ainetsoft.repository;

import com.ainetsoft.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

/**
 * UserRepository for Ainetsoft.
 * Handles both standard User Management and E-commerce Seller functionality.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    // --- BASIC AUTH CHECKS ---
    Boolean existsByEmail(String email);
    Boolean existsByPhone(String phone);

    // --- 🚀 NEW: EMAIL VERIFICATION FLOW ---
    /**
     * Finds a user by the unique token sent to their email during registration.
     */
    Optional<User> findByVerificationToken(String verificationToken);

    // --- SELLER SHOP PROFILE & SLUG CHECKS ---
    Boolean existsByShopProfile_ShopSlug(String shopSlug);
    Optional<User> findByShopProfile_ShopSlug(String shopSlug);

    // --- ADMIN DASHBOARD STATS ---
    long countByRolesContaining(String role);
    long countBySellerVerification(String status);
    List<User> findBySellerVerification(String status);
    long countByAccountStatus(String accountStatus);
    List<User> findByAccountStatus(String accountStatus);

    // --- MULTI-FIELD PENDING QUEUE SUPPORT ---
    List<User> findBySellerVerificationOrAccountStatus(String verification, String status);
    long countBySellerVerificationOrAccountStatus(String verification, String status);

    // --- ADVANCED LOOKUPS ---
    @Query("{ '$or': [ { 'email': { $regex: '^?0$', $options: 'i' } }, { 'phone': ?0 } ] }")
    Optional<User> findByIdentifier(String identifier);

    @Query("{ 'email': { $regex: '^?0$', $options: 'i' } }")
    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);
    Optional<User> findByProviderId(String providerId);
}