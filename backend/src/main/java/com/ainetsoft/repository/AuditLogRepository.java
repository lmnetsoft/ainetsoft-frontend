package com.ainetsoft.repository;

import com.ainetsoft.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * AuditLogRepository for tracking all administrative actions.
 * Essential for the "Nhật ký hệ thống" (Audit Logs) page.
 */
@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    
    // --- DASHBOARD PREVIEWS ---
    /**
     * Get only the latest 10 actions for the quick-view Dashboard widget.
     */
    List<AuditLog> findFirst10ByOrderByTimestampDesc();

    // --- FULL LOGS PAGE (Fixes the "Đang tải" hang) ---
    /**
     * Fetches all logs sorted by date directly from MongoDB.
     * This is much faster than fetching all and sorting in Java.
     */
    List<AuditLog> findAllByOrderByTimestampDesc();

    // --- TARGETED TRACKING ---
    /**
     * Tracks actions performed by a specific sub-admin.
     */
    List<AuditLog> findByAdminIdOrderByTimestampDesc(String adminId);
    
    /**
     * Tracks the history of a specific item (e.g., all bans/approvals for a Product ID).
     */
    List<AuditLog> findByTargetIdOrderByTimestampDesc(String targetId);
}