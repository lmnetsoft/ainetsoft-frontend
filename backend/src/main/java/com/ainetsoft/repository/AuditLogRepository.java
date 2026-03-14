package com.ainetsoft.repository;

import com.ainetsoft.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    
    // Find logs by a specific admin (to track a sub-admin's activity)
    List<AuditLog> findByAdminIdOrderByTimestampDesc(String adminId);
    
    // Find logs related to a specific product or user
    List<AuditLog> findByTargetIdOrderByTimestampDesc(String targetId);
    
    // Get latest actions for the Admin Dashboard "Recent Activity" feed
    List<AuditLog> findFirst10ByOrderByTimestampDesc();
}