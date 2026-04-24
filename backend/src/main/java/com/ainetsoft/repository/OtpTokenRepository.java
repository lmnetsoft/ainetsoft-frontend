package com.ainetsoft.repository;

import com.ainetsoft.model.OtpToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface OtpTokenRepository extends MongoRepository<OtpToken, String> {
    Optional<OtpToken> findTopByPhoneNumberOrderByExpiryDateDesc(String phoneNumber);
    void deleteByPhoneNumber(String phoneNumber);
}