package com.ainetsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token; // The JWT token for frontend storage
    private String fullName;
    private Set<String> roles;
    private String message;

    // --- SECURITY FIELDS FOR UI LOGIC ---
    // These allow the Frontend to show the Crown and Admin Tabs immediately
    private boolean isGlobalAdmin;
    private Set<String> permissions;
}