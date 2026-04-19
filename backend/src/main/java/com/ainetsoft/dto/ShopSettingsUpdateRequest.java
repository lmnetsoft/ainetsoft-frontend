package com.ainetsoft.dto;

import lombok.Data;
import java.util.List;

@Data
public class ShopSettingsUpdateRequest {
    private String shopName;
    private String shopBio;
    private String taxCode;
    // 🚀 FIXED: Added businessType to match frontend selection
    private String businessType; 
    private List<String> invoiceEmails;
    private int lowStockThreshold;
    private boolean holidayMode;
    private List<AddressDTO> stockAddresses;
}