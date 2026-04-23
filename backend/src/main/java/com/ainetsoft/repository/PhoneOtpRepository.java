package com.ainetsoft.repository;

import com.ainetsoft.model.PhoneOtp;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PhoneOtpRepository extends MongoRepository<PhoneOtp, String> {
    
    // Finds the latest OTP for a phone number to check if the code matches
    Optional<PhoneOtp> findTopByPhoneNumberAndOtpCodeOrderByExpiryTimeDesc(String phoneNumber, String otpCode);
    
    // Clean up any old codes for this number before sending a new one
    void deleteByPhoneNumber(String phoneNumber);
}