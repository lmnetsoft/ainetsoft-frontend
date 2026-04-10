package com.ainetsoft.repository;

import com.ainetsoft.model.BankAccount;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface BankAccountRepository extends MongoRepository<BankAccount, String> {
    // 🚀 Fixes the current error in BankAccountService and OrderService
    List<BankAccount> findByUserId(String userId);
    
    // 🚀 Fixes the DataSeeder error
    boolean existsByUserId(String userId); 
    
    // 🚀 Fixes the primary bank lookup in OrderService
    Optional<BankAccount> findByUserIdAndIsDefault(String userId, boolean isDefault);
}