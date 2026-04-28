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
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private String getUserId(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByIdentifier(principal.getName())
                .map(User::getId)
                .orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Principal principal) {
        String userId = getUserId(principal);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(notificationService.getMyNotifications(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        String userId = getUserId(principal);
        if (userId == null) return ResponseEntity.ok(0L);
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Principal principal) {
        String userId = getUserId(principal);
        if (userId == null) return ResponseEntity.status(401).build();
        
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    // 🚀 API MỚI DÀNH CHO ADMIN: PHÁT SÓNG THÔNG BÁO
    @PostMapping("/admin/broadcast")
    public ResponseEntity<?> broadcastMessage(@RequestBody Map<String, String> payload, Principal principal) {
        User admin = userRepository.findByIdentifier(principal.getName()).orElse(null);
        if (admin == null || (!admin.getRoles().contains("ADMIN") && !admin.getRoles().contains("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("message", "Quyền truy cập bị từ chối."));
        }

        String audience = payload.get("audience"); // Truyền vào: "ALL", "SELLERS", "BUYERS"
        String title = payload.get("title");
        String message = payload.get("message");

        if (title == null || message == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tiêu đề và nội dung không được để trống."));
        }

        notificationService.broadcastNotification(audience, title, message);
        return ResponseEntity.ok(Map.of("message", "Đã phát sóng thông báo thành công tới nhóm " + audience));
    }
}