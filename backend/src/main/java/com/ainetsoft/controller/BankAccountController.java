package com.ainetsoft.controller;

import com.ainetsoft.model.BankAccount;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.BankAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/bank-accounts")
public class BankAccountController {

    @Autowired
    private BankAccountService bankAccountService;

    @Autowired
    private UserRepository userRepository;

    /**
     * INTERNAL HELPER: Converts the Email/Identifier from JWT into the Database User ID.
     */
    private String getUserId(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName())
                .map(User::getId)
                .orElse(null);
    }

    /**
     * 🚀 GET MY BANK ACCOUNTS
     * Used by SellerRegister.tsx to check if the user is eligible to register.
     */
    @GetMapping("/my")
    public ResponseEntity<List<BankAccount>> getMyBankAccounts(Principal principal) {
        String userId = getUserId(principal);
        if (userId == null) return ResponseEntity.status(401).build();
        
        return ResponseEntity.ok(bankAccountService.getBankAccountsByUserId(userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BankAccount>> getUserBankAccounts(@PathVariable String userId) {
        return ResponseEntity.ok(bankAccountService.getBankAccountsByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<BankAccount> saveBankAccount(Principal principal, @RequestBody BankAccount account) {
        String userId = getUserId(principal);
        if (userId == null) return ResponseEntity.status(401).build();
        
        // Force the userId to the logged-in user for security
        account.setUserId(userId);
        return ResponseEntity.ok(bankAccountService.saveBankAccount(account));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBankAccount(@PathVariable String id) {
        bankAccountService.deleteBankAccount(id);
        return ResponseEntity.ok().build();
    }
}