package com.ainetsoft.repository;

import com.ainetsoft.model.WithdrawalRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WithdrawalRepository extends MongoRepository<WithdrawalRequest, String> {

    List<WithdrawalRequest> findBySellerIdOrderByCreatedAtDesc(String sellerId);

    List<WithdrawalRequest> findByStatus(String status);

    /**
     * 🚀 FIX: This method is required by DataSeeder to prevent duplicate mock data creation.
     */
    long countBySellerId(String sellerId);

    /**
     * 🔔 FIX: This method is required for the Admin Notification logic 
     * to count requests with status "PENDING".
     */
    long countByStatus(String status);
}