package com.ainetsoft.controller;

import com.ainetsoft.dto.ConversationDTO;
import com.ainetsoft.model.ChatMessage;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.ChatMessageRepository;
import com.ainetsoft.repository.UserRepository;
import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.nio.JpegWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    
    // Thư mục lưu trữ gốc của Chat
    private final Path rootLocation = Paths.get("uploads", "chat");

    // 🚀 HÀM MỚI BỔ SUNG: Tự động dịch MongoDB ID sang Email
    private String resolveToEmail(String identifier) {
        if (identifier != null && identifier.length() == 24 && !identifier.contains("@")) {
            return userRepository.findById(identifier).map(User::getEmail).orElse(identifier);
        }
        return identifier;
    }

    // 🚀 API MỚI: Cho phép Frontend gọi để tra cứu Email từ ID
    @GetMapping("/resolve/{identifier}")
    public ResponseEntity<Map<String, String>> resolveIdentifier(@PathVariable String identifier) {
        return ResponseEntity.ok(Map.of("email", resolveToEmail(identifier)));
    }

    // --- 1. WEBSOCKET LOGIC ---
    @MessageMapping("/chat")
    public void processMessage(ChatMessage chatMessage, Principal principal) {
        String senderId = (principal != null) ? principal.getName() : chatMessage.getSenderId();
        chatMessage.setSenderId(senderId);
        
        // 🚀 BỔ SUNG: Tự động dịch ID người nhận sang Email
        chatMessage.setRecipientId(resolveToEmail(chatMessage.getRecipientId()));
        
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setRead(false);

        ChatMessage savedMsg = chatRepository.save(chatMessage);

        messagingTemplate.convertAndSendToUser(
            chatMessage.getRecipientId(), 
            "/queue/messages", 
            savedMsg
        );
    }

    // --- 2. FILE UPLOAD (Hỗ trợ conversationId) ---
    @PostMapping("/upload/{conversationId}")
    public ResponseEntity<Map<String, String>> uploadFile(
            @PathVariable String conversationId,
            @RequestParam("file") MultipartFile file, 
            Principal principal) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            Path chatPath = rootLocation.resolve(conversationId);
            if (!Files.exists(chatPath)) {
                Files.createDirectories(chatPath);
            }

            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
            }
            
            String fileName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis();
            
            if (extension.equals(".heic") || extension.equals(".heif")) {
                fileName += ".jpg";
                Path destination = chatPath.resolve(fileName);
                ImmutableImage.loader()
                    .fromBytes(file.getBytes())
                    .output(JpegWriter.Default, destination);
            } else {
                fileName += extension;
                Files.copy(file.getInputStream(), chatPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }

            String fileUrl = "/api/chat/file/" + conversationId + "/" + fileName;
            return ResponseEntity.ok(Map.of("url", fileUrl));

        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Processing failed: " + e.getMessage()));
        }
    }

    // --- 3. FILE DOWNLOAD (Giữ lại hàm này để ép tải file về máy) ---
    @GetMapping("/download/{conversationId}/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String conversationId, @PathVariable String fileName) {
        try {
            if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\") ||
                conversationId.contains("..") || conversationId.contains("/") || conversationId.contains("\\")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Path filePath = rootLocation.resolve(conversationId).resolve(fileName).normalize().toAbsolutePath();
            Path rootPath = rootLocation.normalize().toAbsolutePath();

            if (!filePath.startsWith(rootPath)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) contentType = "application/octet-stream";
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            }
        } catch (Exception e) {}
        return ResponseEntity.notFound().build();
    }

    // --- 4. HISTORY & ADMIN AGGREGATION ---
    @GetMapping("/history/{conversationId}")
    public ResponseEntity<List<ChatMessage>> getChatHistoryByConversation(@PathVariable String conversationId) {
        List<ChatMessage> history = chatRepository.findByConversationIdOrderByTimestampAsc(conversationId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/history/{userId1}/{userId2}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable String userId1, @PathVariable String userId2) {
        // 🚀 BỔ SUNG: Dịch ID trước khi lấy lịch sử
        String u1 = resolveToEmail(userId1);
        String u2 = resolveToEmail(userId2);
        List<ChatMessage> history = chatRepository.findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByTimestampAsc(u1, u2, u2, u1);
        return ResponseEntity.ok(history);
    }

    // 🚀 BỔ SUNG: Endpoint mới để Seller lấy hộp thư của riêng họ
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDTO>> getUserConversations(
            @RequestParam(required = false, defaultValue = "") String search,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(chatRepository.findConversationsByUserIdWithSearch(principal.getName(), search));
    }

    @GetMapping("/admin/conversations")
    public ResponseEntity<List<ConversationDTO>> getAdminConversations(@RequestParam(required = false, defaultValue = "") String search) {
        // 🚀 BỔ SUNG: Đã đổi tên hàm Repository để tái sử dụng
        return ResponseEntity.ok(chatRepository.findConversationsByUserIdWithSearch("admin", search));
    }

    // --- 5. NOTES & TAGS ---
    @GetMapping("/admin/notes/{email}")
    public ResponseEntity<Map<String, Object>> getUserNotes(@PathVariable String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        Map<String, Object> response = new HashMap<>();
        response.put("email", email);
        response.put("content", userOpt.map(User::getChatNote).orElse("")); 
        return ResponseEntity.ok(response);
    }

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
        
        String friendlyMsg = String.format(
            "Tài khoản này (%s) hiện chưa có hồ sơ chính thức. Bạn không thể lưu ghi chú cho khách vãng lai hoặc email chưa đăng ký.", 
            email
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", friendlyMsg));
    }

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

        String friendlyMsg = "Không thể gán nhãn: Email này chưa đăng ký tài khoản. Nhãn phân loại chỉ dành cho thành viên chính thức.";
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", friendlyMsg));
    }

    // --- 6. MARK AS READ ---
    @PostMapping("/read/{senderId}/{recipientId}")
    public ResponseEntity<Void> markAsRead(@PathVariable String senderId, @PathVariable String recipientId) {
        // 🚀 BỔ SUNG: Dịch ID sang email trước khi đánh dấu đã đọc
        String s = resolveToEmail(senderId);
        String r = resolveToEmail(recipientId);
        List<ChatMessage> unreadMessages = chatRepository.findBySenderIdAndRecipientIdAndIsRead(s, r, false);
        unreadMessages.forEach(m -> m.setRead(true));
        chatRepository.saveAll(unreadMessages);
        return ResponseEntity.noContent().build();
    }
}