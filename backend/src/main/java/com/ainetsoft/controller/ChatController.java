package com.ainetsoft.controller;

import com.ainetsoft.dto.ConversationDTO;
import com.ainetsoft.model.ChatMessage;
import com.ainetsoft.repository.ChatMessageRepository;
import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.nio.JpegWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.nio.file.*;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatRepository;
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

    // --- 2. FILE UPLOAD (VERIFIED FOR VIDEOS) ---
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

            // HEIC TO JPG CONVERSION (STABLE)
            if (extension.equals(".heic") || extension.equals(".heif")) {
                fileName += ".jpg";
                Path destination = rootLocation.resolve(fileName);
                ImmutableImage.loader()
                    .fromBytes(file.getBytes())
                    .output(JpegWriter.Default, destination);
            } else {
                // NORMAL UPLOAD (JPG, MP4, etc.)
                fileName += extension;
                Files.copy(file.getInputStream(), rootLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }

            // RETURN DIRECT URL (PREVENTS BROKEN PIPE)
            String fileUrl = "http://localhost:8080/uploads/" + fileName;
            return ResponseEntity.ok(Map.of("url", fileUrl));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Processing failed: " + e.getMessage()));
        }
    }

    // --- 3. FILE DOWNLOAD (THE "REDIRECT" FIX) ---
    /**
     * This handles old messages and "funny icons." 
     * We REDIRECT to /uploads/ so the browser can stream the video in chunks.
     * This is the exact fix for the "Broken Pipe" error.
     */
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

    // --- 5. NOTES ENDPOINT (STOPS 404 LOGS) ---
    @GetMapping("/admin/notes/{email}")
    public ResponseEntity<Map<String, Object>> getUserNotes(@PathVariable String email) {
        Map<String, Object> response = new HashMap<>();
        response.put("email", email);
        response.put("notes", ""); 
        return ResponseEntity.ok(response);
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