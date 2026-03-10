package com.ainetsoft.service;

import com.ainetsoft.model.Notification;
import com.ainetsoft.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Creates and saves a notification with a timestamp.
     */
    public void createNotification(String userId, String title, String message, String type, String relatedId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .relatedId(relatedId)
                .isRead(false) // Explicitly set to false for new notifications
                .createdAt(LocalDateTime.now()) // Ensure timestamping
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Retrieves all notifications for a specific user, newest first.
     */
    public List<Notification> getMyNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Efficiently counts unread items without loading them into RAM.
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Marks a single notification as read.
     */
    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    /**
     * OPTIMIZED: Marks ALL notifications for a user as read.
     * Uses a specific repository query to avoid loading the whole history into Java RAM.
     */
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findAllByUserIdAndIsReadFalse(userId);
        if (!unread.isEmpty()) {
            unread.forEach(n -> n.setRead(true));
            notificationRepository.saveAll(unread);
        }
    }
}