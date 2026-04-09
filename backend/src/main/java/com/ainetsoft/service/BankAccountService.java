package com.ainetsoft.service;

import com.ainetsoft.model.BankAccount;
import com.ainetsoft.repository.BankAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BankAccountService {

    @Autowired
    private BankAccountRepository bankAccountRepository;

    // 🚀 ELITE SECURITY: Use a 16-character key for AES-128
    private static final String ALGORITHM = "AES";
    private static final String SECRET_KEY = "AiNetsoftEliteK!"; // Ensure this is exactly 16 chars

    public List<BankAccount> getBankAccountsByUserId(String userId) {
        List<BankAccount> accounts = bankAccountRepository.findByUserId(userId);
        // Decrypt each account number before sending it to the React frontend
        return accounts.stream()
                .map(this::decryptAccount)
                .collect(Collectors.toList());
    }

    public BankAccount saveBankAccount(BankAccount account) {
        List<BankAccount> existing = bankAccountRepository.findByUserId(account.getUserId());
        
        // --- 1. PRESERVED: Default Account Logic ---
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

        // --- 2. 🚀 NEW: Encrypt before hitting MongoDB ---
        if (account.getAccountNumber() != null) {
            account.setAccountNumber(encrypt(account.getAccountNumber()));
        }

        account.setUpdatedAt(LocalDateTime.now());
        BankAccount saved = bankAccountRepository.save(account);

        // --- 3. Return decrypted object so the UI stays clean ---
        return decryptAccount(saved);
    }

    public void deleteBankAccount(String id) {
        bankAccountRepository.deleteById(id);
    }

    // --- PRIVATE UTILS ---

    private BankAccount decryptAccount(BankAccount account) {
        if (account != null && account.getAccountNumber() != null) {
            account.setAccountNumber(decrypt(account.getAccountNumber()));
        }
        return account;
    }

    private String encrypt(String value) {
        try {
            SecretKeySpec skeySpec = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, skeySpec);
            byte[] encrypted = cipher.doFinal(value.getBytes());
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception ex) {
            throw new RuntimeException("Encryption error", ex);
        }
    }

    private String decrypt(String encrypted) {
        try {
            SecretKeySpec skeySpec = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, skeySpec);
            byte[] original = cipher.doFinal(Base64.getDecoder().decode(encrypted));
            return new String(original);
        } catch (Exception ex) {
            // If data was already in plain text (old data), just return it
            return encrypted;
        }
    }
}