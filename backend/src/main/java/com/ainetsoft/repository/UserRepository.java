package com.ainetsoft.repository;

import com.ainetsoft.model.User;
import org.springframework.data.domain.Page; 
import org.springframework.data.domain.Pageable; 
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

/**
 * UserRepository for Ainetsoft.
 * Handles both standard User Management and E-commerce Seller functionality.
 * Optimized for Phases 3, 4, and 5.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    // --- 🚀 PHASE 1, 2, 3 & 4: ADVANCED SEARCH & FILTERING ---
    /**
     * Finds users based on keyword (name/email/phone/shopName), role, and status.
     * 🛡️ FIXED: Corrected parameter syntax in $expr to support the 'ALL' bypass.
     */
    @Query("{ " +
           "  $and: [ " +
           "    { $or: [ " +
           "      { 'fullName': { $regex: ?0, $options: 'i' } }, " +
           "      { 'email': { $regex: ?0, $options: 'i' } }, " +
           "      { 'phone': { $regex: ?0, $options: 'i' } }, " +
           "      { 'shopProfile.shopName': { $regex: ?0, $options: 'i' } } " +
           "    ] }, " +
           "    { $or: [ { $expr: { $eq: [?1, 'ALL'] } }, { 'roles': ?1 } ] }, " +
           "    { $or: [ { $expr: { $eq: [?2, 'ALL'] } }, { 'accountStatus': ?2 } ] } " +
           "  ] " +
           "}")
    Page<User> findAllByFilters(String search, String role, String status, Pageable pageable);

    // --- BASIC AUTH CHECKS (100% ORIGINAL) ---
    Boolean existsByEmail(String email);
    Boolean existsByPhone(String phone);

    // --- EMAIL VERIFICATION FLOW (100% ORIGINAL) ---
    Optional<User> findByVerificationToken(String verificationToken);

    // --- SELLER SHOP PROFILE & SLUG CHECKS (100% ORIGINAL) ---
    Boolean existsByShopProfile_ShopSlug(String shopSlug);
    Optional<User> findByShopProfile_ShopSlug(String shopSlug);

    // --- ADMIN DASHBOARD STATS (100% ORIGINAL) ---
    long countByRolesContaining(String role);
    List<User> findByRolesContaining(String role);

    long countBySellerVerification(String status);
    List<User> findBySellerVerification(String status);
    long countByAccountStatus(String accountStatus);
    List<User> findByAccountStatus(String accountStatus);

    // --- MULTI-FIELD PENDING QUEUE SUPPORT (100% ORIGINAL) ---
    List<User> findBySellerVerificationOrAccountStatus(String verification, String status);
    long countBySellerVerificationOrAccountStatus(String verification, String status);

    // --- ADVANCED LOOKUPS (100% ORIGINAL) ---
    @Query("{ '$or': [ { 'email': { $regex: '^?0$', $options: 'i' } }, { 'phone': ?0 } ] }")
    Optional<User> findByIdentifier(String identifier);

    @Query("{ 'email': { $regex: '^?0$', $options: 'i' } }")
    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);
    Optional<User> findByProviderId(String providerId);
}