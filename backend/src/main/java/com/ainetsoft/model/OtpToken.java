package com.ainetsoft.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "otp_tokens")
public class OtpToken {
    @Id
    private String id;
    private String phoneNumber;
    private String code;
    private LocalDateTime expiryDate;
    
    // 🛡️ Fixed: Use expireAfter = "0s" to avoid deprecation warnings
    // This still tells MongoDB to delete the document at the exact time stored in expireAt
    @Indexed(name = "expire_at_index", expireAfter = "0s")
    private LocalDateTime expireAt;
}