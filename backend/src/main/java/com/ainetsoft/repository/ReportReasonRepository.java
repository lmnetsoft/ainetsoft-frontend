package com.ainetsoft.repository;

import com.ainetsoft.model.ReportReason;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ReportReasonRepository extends MongoRepository<ReportReason, String> {
    List<ReportReason> findByActiveTrue(); // Only get reasons currently in use
}