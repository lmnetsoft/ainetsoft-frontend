package com.ainetsoft.controller;

import com.ainetsoft.model.BankAccount;
import com.ainetsoft.service.BankAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bank-accounts")
public class BankAccountController {

    @Autowired
    private BankAccountService bankAccountService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BankAccount>> getUserBankAccounts(@PathVariable String userId) {
        return ResponseEntity.ok(bankAccountService.getBankAccountsByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<BankAccount> saveBankAccount(@RequestBody BankAccount account) {
        return ResponseEntity.ok(bankAccountService.saveBankAccount(account));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBankAccount(@PathVariable String id) {
        bankAccountService.deleteBankAccount(id);
        return ResponseEntity.ok().build();
    }
}
