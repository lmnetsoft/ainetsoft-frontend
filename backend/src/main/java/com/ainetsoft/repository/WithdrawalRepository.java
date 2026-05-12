package com.ainetsoft.repository;

import com.ainetsoft.model.WithdrawalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WithdrawalRepository extends MongoRepository<WithdrawalRequest, String> {
    List<WithdrawalRequest> findBySellerIdOrderByCreatedAtDesc(String sellerId);
    List<WithdrawalRequest> findByUserIdOrderByCreatedAtDesc(String userId);
    long countByStatus(String status);
    
    // Hàm được khôi phục cho DataSeeder
    long countBySellerId(String sellerId);
    
    // Truy vấn phân trang theo trạng thái
    Page<WithdrawalRequest> findByStatus(String status, Pageable pageable);
}
