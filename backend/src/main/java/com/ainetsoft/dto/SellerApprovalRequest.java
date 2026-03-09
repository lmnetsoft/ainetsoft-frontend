package com.ainetsoft.dto;

import lombok.Data;

@Data
public class SellerApprovalRequest {
    private boolean approved;
    private String adminNote; // Reason for approval or rejection
}