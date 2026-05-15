package com.ainetsoft.repository;

import com.ainetsoft.model.User;
import org.springframework.data.domain.Page; 
import org.springframework.data.domain.Pageable; 
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
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

    Boolean existsByEmail(String email);
    Boolean existsByPhone(String phone);

    Optional<User> findByVerificationToken(String verificationToken);

    Boolean existsByShopProfile_ShopSlug(String shopSlug);
    Optional<User> findByShopProfile_ShopSlug(String shopSlug);

    long countByRolesContaining(String role);
    List<User> findByRolesContaining(String role);

    long countBySellerVerification(String status);
    List<User> findBySellerVerification(String status);
    long countByAccountStatus(String accountStatus);
    List<User> findByAccountStatus(String accountStatus);

    List<User> findBySellerVerificationOrAccountStatus(String verification, String status);
    long countBySellerVerificationOrAccountStatus(String verification, String status);

    List<User> findByHasPendingUpdateTrue();
    long countByHasPendingUpdateTrue();

    @Query("{ '$or': [ { 'email': { $regex: '^?0$', $options: 'i' } }, { 'phone': ?0 } ] }")
    Optional<User> findByIdentifier(String identifier);

    @Query("{ 'email': { $regex: '^?0$', $options: 'i' } }")
    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);
    Optional<User> findByProviderId(String providerId);

    // --- 🚀 NEW: QUICK SEARCH FOR DROPDOWNS ---
    List<User> findTop10ByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String fullName, String email);
}
