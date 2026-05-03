package com.ainetsoft.repository;

import com.ainetsoft.model.Voucher;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends MongoRepository<Voucher, String> {
    Optional<Voucher> findByCode(String code);
    List<Voucher> findBySellerId(String sellerId);
    List<Voucher> findByIsActiveTrue();
}