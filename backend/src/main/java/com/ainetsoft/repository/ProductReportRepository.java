package com.ainetsoft.repository;

import com.ainetsoft.model.ProductReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query; 
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Collection;

@Repository
public interface ProductReportRepository extends MongoRepository<ProductReport, String> {
    
    // Find reports for a specific product (100% ORIGINAL)
    List<ProductReport> findByProductId(String productId);
    
    // Find all reports against a specific Seller (Shop) (100% ORIGINAL)
    List<ProductReport> findBySellerId(String sellerId);
    
    // Filter by status (e.g., show all "PENDING" to the Admin) (100% ORIGINAL)
    List<ProductReport> findByStatus(String status);
    
    // Find reports made by a specific user (100% ORIGINAL)
    List<ProductReport> findByReporterId(String reporterId);

    // Count pending reports for a seller (useful for "Warnings") (100% ORIGINAL)
    long countBySellerIdAndStatus(String sellerId, String status);

    // --- 🚀 PHASE 5 APPENDS: BATCH OPERATIONS SUPPORT ---

    /**
     * PHASE 5: Batch Lookup.
     * Allows the AdminService to fetch all selected reports in a single DB trip.
     */
    List<ProductReport> findAllByIdIn(Collection<String> ids);

    /**
     * 🛡️ FIXED FOR STABILITY:
     * Changed from 'findByReasonIdIn' to 'findByReasonIn' because 
     * ProductReport.reason is a String, not an object with an ID.
     */
    List<ProductReport> findByReasonInAndStatus(Collection<String> reasons, String status);

    /**
     * PHASE 5: Batch Stats.
     * Returns counts of reports grouped by status for specific products.
     */
    long countByProductIdInAndStatus(Collection<String> productIds, String status);
}