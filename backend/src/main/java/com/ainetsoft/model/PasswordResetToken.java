package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    private String id;

    @Indexed
    private String contactInfo;

    private String otpCode;

    // Fixed: Updated to use 'expireAfter' to resolve deprecation warnings
    @Indexed(expireAfter = "0s") 
    private LocalDateTime expiryDate;
}