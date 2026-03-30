package com.ainetsoft.controller;

import com.ainetsoft.model.Notification;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    // 🛠️ ADDED: Need UserRepository to find the true Database ID
    private final UserRepository userRepository;

    /**
     * INTERNAL HELPER: Converts the Email from JWT into the Database User ID.
     */
    private String getUserId(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName())
                .map(User::getId)
                .orElse(null);
    }

    /**
     * Get all notifications for the current user.
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Principal principal) {
        String userId = getUserId(principal);
        if (userId == null) return ResponseEntity.status(401).build();
        
        return ResponseEntity.ok(notificationService.getMyNotifications(userId));
    }

    /**
     * Returns the raw number of unread notifications for the Bell icon.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        String userId = getUserId(principal);
        if (userId == null) return ResponseEntity.ok(0L);
        
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    /**
     * Mark a single notification as read.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Mark ALL as read.
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Principal principal) {
        String userId = getUserId(principal);
        if (userId == null) return ResponseEntity.status(401).build();
        
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}