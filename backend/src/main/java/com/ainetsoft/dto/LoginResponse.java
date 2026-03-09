package com.ainetsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token; // NEW: The JWT token for frontend storage
    private String fullName;
    private Set<String> roles;
    private String message;
}