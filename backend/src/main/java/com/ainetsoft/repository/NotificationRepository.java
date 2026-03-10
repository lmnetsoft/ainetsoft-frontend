package com.ainetsoft.repository;

import com.ainetsoft.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    
    // 1. Fetch full history for the Notification Page (Sorted by Newest)
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    
    // 2. Used by the Header's "Bell" circle to get the live count
    long countByUserIdAndIsReadFalse(String userId);

    // 3. NEW: Optimized for "Mark All as Read" logic
    // Fetches ONLY unread items for bulk updating, saving database performance
    List<Notification> findAllByUserIdAndIsReadFalse(String userId);
}