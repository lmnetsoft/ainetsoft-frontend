package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "audit_logs")
public class AuditLog {
    @Id
    private String id;

    // The Admin who performed the action
    private String adminId;
    private String adminEmail;
    private String adminName;

    // The type of action performed
    private String actionType; // e.g., "APPROVE_PRODUCT", "DELETE_CATEGORY", "PROMOTE_USER"
    
    // Details about what changed
    private String targetId;   // ID of the Product, User, or Category affected
    private String targetName; // Name of the target for easy reading in the UI
    private String description; // e.g., "Changed status from PENDING to APPROVED"

    // Metadata
    private String ipAddress;  // Useful for security tracking in production
    
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Standard Action Types to keep the database clean
     */
    public static final class Actions {
        public static final String APPROVE_PRODUCT = "APPROVE_PRODUCT";
        public static final String REJECT_PRODUCT = "REJECT_PRODUCT";
        public static final String DELETE_PRODUCT = "DELETE_PRODUCT";
        public static final String CREATE_CATEGORY = "CREATE_CATEGORY";
        public static final String UPDATE_CATEGORY = "UPDATE_CATEGORY";
        public static final String DELETE_CATEGORY = "DELETE_CATEGORY";
        public static final String PROMOTE_USER = "PROMOTE_USER";
        public static final String BAN_USER = "BAN_USER";
        public static final String UPDATE_PERMISSIONS = "UPDATE_PERMISSIONS";
    }
}