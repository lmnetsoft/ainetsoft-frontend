package com.ainetsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerRegistrationDTO {
    // Basic Contact
    private String phone;

    // Identity Info
    private String cccdNumber;

    // Shop Details
    private String shopName;
    private String shopAddress;
    private String taxCode;
    // Banking Details
    private String bankName;
    private String accountNumber;
    private String accountHolder;
}