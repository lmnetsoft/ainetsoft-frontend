package com.ainetsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerApprovalRequest {
    private boolean approved;
    private String adminNote; // The "Lý do từ chối" that appears in the UI
}