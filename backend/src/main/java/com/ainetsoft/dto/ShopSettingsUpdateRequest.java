package com.ainetsoft.dto;

import lombok.Data;
import java.util.List;

@Data
public class ShopSettingsUpdateRequest {
    private String shopName;
    private String shopBio;
    private String taxCode;
    private List<String> invoiceEmails;
    private int lowStockThreshold; // Fixed: Added this
    private boolean holidayMode;   // Fixed: Added this
    private List<AddressDTO> stockAddresses;
}