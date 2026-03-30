package com.ainetsoft.service;

import com.ainetsoft.model.Notification;
import com.ainetsoft.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * 🚀 CREATE NOTIFICATION
     * Used by OrderService, AdminService, etc.
     */
    @Transactional
    public void createNotification(String userId, String title, String message, String type, String relatedId) {
        try {
            Notification notification = Notification.builder()
                    .userId(userId)
                    .title(title)
                    .message(message)
                    .type(type)
                    .relatedId(relatedId)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);
            log.info("Notification created for user {}: {}", userId, title);
        } catch (Exception e) {
            log.error("Failed to create notification: {}", e.getMessage());
        }
    }

    /**
     * 🔔 GET UNREAD COUNT
     * Used by the Bell icon in the header.
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * 📜 GET NOTIFICATION LIST
     * Used by the Notification Page.
     */
    public List<Notification> getMyNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * ✅ MARK AS READ
     */
    @Transactional
    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    /**
     * ✅ MARK ALL AS READ
     */
    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findAllByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}