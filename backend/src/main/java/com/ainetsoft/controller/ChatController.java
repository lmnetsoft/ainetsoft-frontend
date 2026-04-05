package com.ainetsoft.controller;

import com.ainetsoft.dto.ConversationDTO;
import com.ainetsoft.model.ChatMessage;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.ChatMessageRepository;
import com.ainetsoft.repository.UserRepository;
import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.nio.JpegWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 🚀 Added for professional auditing
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.nio.file.*;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatRepository;
    private final UserRepository userRepository; 
    private final Path rootLocation = Paths.get("uploads");

    // --- 1. WEBSOCKET LOGIC (STABLE) ---
    @MessageMapping("/chat")
    public void processMessage(ChatMessage chatMessage, Principal principal) {
        String senderId = (principal != null) ? principal.getName() : chatMessage.getSenderId();
        chatMessage.setSenderId(senderId);
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setRead(false);

        ChatMessage savedMsg = chatRepository.save(chatMessage);

        messagingTemplate.convertAndSendToUser(
            chatMessage.getRecipientId(), 
            "/queue/messages", 
            savedMsg
        );
    }

    // --- 2. FILE UPLOAD (STABLE) ---
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file, Principal principal) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
            }
            
            String fileName = UUID.randomUUID().toString();
            
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }

            if (extension.equals(".heic") || extension.equals(".heif")) {
                fileName += ".jpg";
                Path destination = rootLocation.resolve(fileName);
                ImmutableImage.loader()
                    .fromBytes(file.getBytes())
                    .output(JpegWriter.Default, destination);
            } else {
                fileName += extension;
                Files.copy(file.getInputStream(), rootLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }

            String fileUrl = "http://localhost:8080/uploads/" + fileName;
            return ResponseEntity.ok(Map.of("url", fileUrl));

        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Processing failed: " + e.getMessage()));
        }
    }

    // --- 3. FILE DOWNLOAD (STABLE) ---
    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Void> downloadFile(@PathVariable String fileName) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create("/uploads/" + fileName))
                .build();
    }

    // --- 4. HISTORY & ADMIN AGGREGATION (STABLE) ---
    @GetMapping("/history/{userId1}/{userId2}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable String userId1, @PathVariable String userId2) {
        List<ChatMessage> history = chatRepository.findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByTimestampAsc(userId1, userId2, userId2, userId1);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/admin/conversations")
    public ResponseEntity<List<ConversationDTO>> getAdminConversations(@RequestParam(required = false, defaultValue = "") String search) {
        return ResponseEntity.ok(chatRepository.findAdminConversationsWithSearch(search));
    }

    // --- 5. 🚀 ENHANCED: NOTES & TAGS (WITH FRIENDLY EXCEPTIONS) ---

    @GetMapping("/admin/notes/{email}")
    public ResponseEntity<Map<String, Object>> getUserNotes(@PathVariable String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        Map<String, Object> response = new HashMap<>();
        response.put("email", email);
        response.put("content", userOpt.map(User::getChatNote).orElse("")); 
        return ResponseEntity.ok(response);
    }

    /**
     * PRO: Checks for official profile existence and returns friendly Vietnamese messages.
     */
    @PostMapping("/admin/notes")
    public ResponseEntity<?> saveUserNote(@RequestBody Map<String, String> payload) {
        String email = payload.get("userId");
        String content = payload.get("content");

        if (!StringUtils.hasText(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email identifier is required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setChatNote(content);
            userRepository.save(user);
            log.info("Admin updated note for user: {}", email);
            return ResponseEntity.ok(Map.of("message", "Note saved successfully"));
        }
        
        // 🚀 FRIENDLY EXCEPTION: Explains why the note can't be saved (Visitor/Temp user)
        String friendlyMsg = String.format(
            "Tài khoản này (%s) hiện chưa có hồ sơ chính thức. Bạn không thể lưu ghi chú cho khách vãng lai hoặc email chưa đăng ký.", 
            email
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", friendlyMsg));
    }

    /**
     * PRO: Prevents tagging guest/fake users while providing clear feedback.
     */
    @PostMapping("/admin/tags/toggle")
    public ResponseEntity<?> toggleUserTag(@RequestBody Map<String, String> payload) {
        String email = payload.get("userId");
        String tag = payload.get("tag");

        if (!StringUtils.hasText(email) || !StringUtils.hasText(tag)) {
            return ResponseEntity.badRequest().body(Map.of("error", "UserId and Tag are required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            List<String> tags = user.getTags();
            if (tags == null) tags = new ArrayList<>();
            
            if (tags.contains(tag)) {
                tags.remove(tag);
            } else {
                tags.add(tag);
            }
            
            user.setTags(tags);
            userRepository.save(user);
            log.info("Admin toggled tag '{}' for user: {}", tag, email);
            return ResponseEntity.ok(Map.of("tags", tags));
        }

        // 🚀 FRIENDLY EXCEPTION: Explains that labels are reserved for registered members
        String friendlyMsg = "Không thể gán nhãn: Email này chưa đăng ký tài khoản. Nhãn phân loại chỉ dành cho thành viên chính thức.";
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", friendlyMsg));
    }

    // --- 6. MARK AS READ (STABLE) ---
    @PostMapping("/read/{senderId}/{recipientId}")
    public ResponseEntity<Void> markAsRead(@PathVariable String senderId, @PathVariable String recipientId) {
        List<ChatMessage> unreadMessages = chatRepository.findBySenderIdAndRecipientIdAndIsRead(senderId, recipientId, false);
        unreadMessages.forEach(m -> m.setRead(true));
        chatRepository.saveAll(unreadMessages);
        return ResponseEntity.noContent().build();
    }
}