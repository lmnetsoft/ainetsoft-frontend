package com.ainetsoft.repository;

import com.ainetsoft.model.User;
import org.springframework.data.domain.Page; // 🚀 NEW
import org.springframework.data.domain.Pageable; // 🚀 NEW
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
    
    // --- 🚀 PHASE 1: ADVANCED SEARCH & FILTERING ---
    /**
     * Finds users based on keyword (name/email), role, and status.
     * Passing 'ALL' for role or status ignores that specific filter.
     */
    @Query("{ " +
           "  $and: [ " +
           "    { $or: [ { 'fullName': { $regex: ?0, $options: 'i' } }, { 'email': { $regex: ?0, $options: 'i' } } ] }, " +
           "    { $or: [ { $expr: { $eq: ['?1', 'ALL'] } }, { 'roles': ?1 } ] }, " +
           "    { $or: [ { $expr: { $eq: ['?2', 'ALL'] } }, { 'accountStatus': ?2 } ] } " +
           "  ] " +
           "}")
    Page<User> findAllByFilters(String search, String role, String status, Pageable pageable);

    // --- BASIC AUTH CHECKS ---
    Boolean existsByEmail(String email);
    Boolean existsByPhone(String phone);

    // --- EMAIL VERIFICATION FLOW ---
    Optional<User> findByVerificationToken(String verificationToken);

    // --- SELLER SHOP PROFILE & SLUG CHECKS ---
    Boolean existsByShopProfile_ShopSlug(String shopSlug);
    Optional<User> findByShopProfile_ShopSlug(String shopSlug);

    // --- ADMIN DASHBOARD STATS ---
    long countByRolesContaining(String role);
    List<User> findByRolesContaining(String role);

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