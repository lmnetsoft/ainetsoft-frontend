package com.ainetsoft.repository;

import com.ainetsoft.model.BankAccount;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface BankAccountRepository extends MongoRepository<BankAccount, String> {
    List<BankAccount> findByUserId(String userId);
    Optional<BankAccount> findByUserIdAndIsDefault(String userId, boolean isDefault);
}
