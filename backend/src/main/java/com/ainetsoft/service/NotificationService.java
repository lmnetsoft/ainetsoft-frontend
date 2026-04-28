package com.ainetsoft.service;

import com.ainetsoft.model.Notification;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.NotificationRepository;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate; 

    /**
     * 🚀 THÔNG BÁO CÁ NHÂN (1-1)
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

            Notification saved = notificationRepository.save(notification);
            
            // 🚀 BẢN VÁ: Gửi trực tiếp vào /topic/ đích danh để né lỗi Anonymous Session
            userRepository.findById(userId).ifPresent(user -> {
                String routingIdentifier = (user.getEmail() != null) ? user.getEmail() : user.getPhone();
                messagingTemplate.convertAndSend("/topic/notifications/" + routingIdentifier, saved);
            });
            
            log.info("Notification pushed for user {}: {}", userId, title);
        } catch (Exception e) {
            log.error("Failed to create notification: {}", e.getMessage());
        }
    }

    /**
     * 📢 THÔNG BÁO PHÁT SÓNG (BROADCAST / 1-N)
     */
    @Transactional
    public void broadcastNotification(String targetAudience, String title, String message) {
        List<User> targetUsers;
        
        if ("SELLERS".equalsIgnoreCase(targetAudience)) {
            targetUsers = userRepository.findAll().stream()
                    .filter(u -> u.getRoles() != null && (u.getRoles().contains("SELLER") || u.getRoles().contains("ROLE_SELLER")))
                    .toList();
        } else if ("BUYERS".equalsIgnoreCase(targetAudience)) {
            targetUsers = userRepository.findAll().stream()
                    .filter(u -> u.getRoles() == null || 
                            (!u.getRoles().contains("ADMIN") && 
                             !u.getRoles().contains("ROLE_ADMIN") && 
                             !u.getRoles().contains("SELLER") && 
                             !u.getRoles().contains("ROLE_SELLER")))
                    .toList();
        } else {
            targetUsers = userRepository.findAll(); 
        }

        List<Notification> notifications = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (User user : targetUsers) {
            notifications.add(Notification.builder()
                    .userId(user.getId())
                    .title(title)
                    .message(message)
                    .type("SYSTEM")
                    .relatedId("BROADCAST")
                    .isRead(false)
                    .createdAt(now)
                    .build());
        }

        List<Notification> savedList = notificationRepository.saveAll(notifications);

        // 🚀 BẢN VÁ: Bắn song song qua đường ống Kênh chung đích danh
        for (int i = 0; i < targetUsers.size(); i++) {
            User u = targetUsers.get(i);
            Notification n = savedList.get(i);
            String routingIdentifier = (u.getEmail() != null) ? u.getEmail() : u.getPhone();
            messagingTemplate.convertAndSend("/topic/notifications/" + routingIdentifier, n);
        }
        
        log.info("🚀 Broadcasted system message to {} users in group {}", targetUsers.size(), targetAudience);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public List<Notification> getMyNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findAllByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}