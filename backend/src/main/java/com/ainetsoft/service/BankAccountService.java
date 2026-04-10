package com.ainetsoft.service;

import com.ainetsoft.model.BankAccount;
import com.ainetsoft.repository.BankAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BankAccountService {

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private EncryptionService encryptionService; // 🚀 Use the new shared service

    public List<BankAccount> getBankAccountsByUserId(String userId) {
        List<BankAccount> accounts = bankAccountRepository.findByUserId(userId);
        return accounts.stream()
                .map(this::decryptAccount)
                .collect(Collectors.toList());
    }

    public BankAccount saveBankAccount(BankAccount account) {
        List<BankAccount> existing = bankAccountRepository.findByUserId(account.getUserId());
        
        if (existing.isEmpty()) {
            account.setDefault(true);
        }

        if (account.isDefault()) {
            existing.forEach(a -> {
                if (a.isDefault() && (account.getId() == null || !a.getId().equals(account.getId()))) {
                    a.setDefault(false);
                    bankAccountRepository.save(a);
                }
            });
        }

        // 🚀 Use shared encryption service
        if (account.getAccountNumber() != null) {
            account.setAccountNumber(encryptionService.encrypt(account.getAccountNumber()));
        }

        account.setUpdatedAt(LocalDateTime.now());
        BankAccount saved = bankAccountRepository.save(account);
        return decryptAccount(saved);
    }

    public void deleteBankAccount(String id) {
        bankAccountRepository.deleteById(id);
    }

    private BankAccount decryptAccount(BankAccount account) {
        if (account != null && account.getAccountNumber() != null) {
            account.setAccountNumber(encryptionService.decrypt(account.getAccountNumber()));
        }
        return account;
    }
}