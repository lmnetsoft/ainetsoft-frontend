package com.ainetsoft.service;

import com.ainetsoft.model.BankAccount;
import com.ainetsoft.repository.BankAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BankAccountService {

    @Autowired
    private BankAccountRepository bankAccountRepository;

    public List<BankAccount> getBankAccountsByUserId(String userId) {
        return bankAccountRepository.findByUserId(userId);
    }

    public BankAccount saveBankAccount(BankAccount account) {
        List<BankAccount> existing = bankAccountRepository.findByUserId(account.getUserId());
        
        // If it is the user's first account, it becomes the default
        if (existing.isEmpty()) {
            account.setDefault(true);
        }

        // Handle mutual exclusivity for the default flag
        if (account.isDefault()) {
            existing.forEach(a -> {
                if (a.isDefault() && !a.getId().equals(account.getId())) {
                    a.setDefault(false);
                    bankAccountRepository.save(a);
                }
            });
        }

        account.setUpdatedAt(LocalDateTime.now());
        return bankAccountRepository.save(account);
    }

    public void deleteBankAccount(String id) {
        bankAccountRepository.deleteById(id);
    }
}
