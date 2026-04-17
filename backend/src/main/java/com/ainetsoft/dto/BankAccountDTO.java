package com.ainetsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 🚀 NEW: Data Transfer Object for Bank Account Updates.
 * Required for the /api/auth/bank-account/update endpoint.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccountDTO {
    private String bankName;
    private String accountHolder;
    private String accountNumber;
}