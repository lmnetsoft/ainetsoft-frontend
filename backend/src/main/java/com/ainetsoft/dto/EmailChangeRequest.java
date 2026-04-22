package com.ainetsoft.dto;

import lombok.Data;

@Data
public class EmailChangeRequest {
    private String currentContact;
    private String newEmail;
    private String otp;
}