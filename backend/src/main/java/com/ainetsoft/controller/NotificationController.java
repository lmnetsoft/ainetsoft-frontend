package com.ainetsoft.controller;

import com.ainetsoft.model.Notification;
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

    /**
     * Get all notifications for the current user.
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        
        // principal.getName() returns the unique ID (Email/Phone) from the JWT
        return ResponseEntity.ok(notificationService.getMyNotifications(principal.getName()));
    }

    /**
     * Returns the raw number of unread notifications.
     * Matches the 'res.data' expectation in your React NotificationContext.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        if (principal == null) return ResponseEntity.ok(0L);
        
        long count = notificationService.getUnreadCount(principal.getName());
        return ResponseEntity.ok(count);
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
     * This is the "Clear All" logic we discussed for the Admin.
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        
        notificationService.markAllAsRead(principal.getName());
        return ResponseEntity.ok().build();
    }
}