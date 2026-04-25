package com.ainetsoft.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ShopSettingsUpdateRequest {
    private String shopName;
    private String shopBio;
    private String taxCode;
    private String businessType; 
    private List<String> invoiceEmails;
    private int lowStockThreshold;
    private boolean holidayMode;
    private List<AddressDTO> stockAddresses;
    
    // 🚀 SHIPPING SETTINGS
    private List<String> enabledShippingMethodIds; 
    private List<String> customShippingMethods;    
    private LocalDateTime expressPausedUntil; 
    
    // 🚀 NEW: Thermal Printing Config
    private boolean thermalPrintingEnabled;
}