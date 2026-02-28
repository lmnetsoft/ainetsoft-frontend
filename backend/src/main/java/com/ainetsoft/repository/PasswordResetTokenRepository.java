package com.ainetsoft.repository;

import com.ainetsoft.model.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for PasswordResetToken.
 * Spring Data MongoDB generates the implementation automatically.
 */
@Repository
public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {

    /**
     * Finds a valid token by contact info and the OTP code.
     */
    Optional<PasswordResetToken> findByContactInfoAndOtpCode(String contactInfo, String otpCode);

    /**
     * Deletes any existing tokens for a specific contact.
     * Useful for cleaning up before sending a new OTP.
     */
    void deleteByContactInfo(String contactInfo);
}