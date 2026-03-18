package com.ainetsoft.repository;

import com.ainetsoft.model.ProductReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductReportRepository extends MongoRepository<ProductReport, String> {
    
    // Find reports for a specific product
    List<ProductReport> findByProductId(String productId);
    
    // Find all reports against a specific Seller (Shop)
    List<ProductReport> findBySellerId(String sellerId);
    
    // Filter by status (e.g., show all "PENDING" to the Admin)
    List<ProductReport> findByStatus(String status);
    
    // Find reports made by a specific user
    List<ProductReport> findByReporterId(String reporterId);

    // Count pending reports for a seller (useful for "Warnings")
    long countBySellerIdAndStatus(String sellerId, String status);
}