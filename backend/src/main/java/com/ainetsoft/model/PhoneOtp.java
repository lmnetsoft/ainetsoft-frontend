package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "phone_otps")
public class PhoneOtp {
    @Id
    private String id;

    @Indexed
    private String phoneNumber;
    
    private String otpCode;

    // This field tells MongoDB to delete the record automatically when this time is reached
    @Indexed(expireAfterSeconds = 0)
    private LocalDateTime expiryTime;

    public PhoneOtp(String phoneNumber, String otpCode, int expiryMinutes) {
        this.phoneNumber = phoneNumber;
        this.otpCode = otpCode;
        this.expiryTime = LocalDateTime.now().plusMinutes(expiryMinutes);
    }
}