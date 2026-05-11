package com.ainetsoft.repository;

import com.ainetsoft.model.WithdrawalRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WithdrawalRepository extends MongoRepository<WithdrawalRequest, String> {
    List<WithdrawalRequest> findBySellerIdOrderByCreatedAtDesc(String sellerId);
    
    // Tìm lịch sử rút tiền của Buyer
    List<WithdrawalRequest> findByUserIdOrderByCreatedAtDesc(String userId);
    
    long countByStatus(String status);
    
    // 🚀 Bổ sung hàm bị thiếu để DataSeeder chạy mượt mà
    long countBySellerId(String sellerId);
}
