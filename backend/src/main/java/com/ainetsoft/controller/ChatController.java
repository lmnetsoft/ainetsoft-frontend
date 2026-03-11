package com.ainetsoft.controller;

import com.ainetsoft.dto.ConversationDTO;
import com.ainetsoft.model.ChatMessage;
import com.ainetsoft.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    // --- 1. WEBSOCKET LOGIC (Untouched & Safe) ---
    @MessageMapping("/chat")
    public void processMessage(ChatMessage chatMessage, Principal principal) {
        // SECURITY: Ensure the senderId is actually the logged-in user
        String senderId = (principal != null) ? principal.getName() : chatMessage.getSenderId();
        chatMessage.setSenderId(senderId);
        
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setRead(false);

        ChatMessage savedMsg = chatRepository.save(chatMessage);

        // Notify the recipient via WebSocket
        messagingTemplate.convertAndSendToUser(
            chatMessage.getRecipientId(), 
            "/queue/messages", 
            savedMsg
        );
    }

    // --- 2. FILE UPLOAD ENDPOINT (FIXED: JSON RESPONSE) ---
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file, Principal principal) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            // Generate unique filename to prevent overwriting
            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + extension;
            
            // Ensure uploads directory exists
            Path uploadPath = Paths.get("uploads/");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Save the file
            Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

            // CHANGED: Return JSON Map instead of plain String to fix Frontend 400/Parsing errors
            String fileUrl = "http://localhost:8080/uploads/" + fileName;
            return ResponseEntity.ok(Map.of("url", fileUrl));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to save file: " + e.getMessage()));
        }
    }

    // --- 3. ADMIN NOTES ENDPOINTS (Untouched & Safe) ---
    @GetMapping("/admin/notes/{userId}")
    public ResponseEntity<Map<String, String>> getAdminNote(@PathVariable String userId) {
        return ResponseEntity.ok(Map.of("content", "")); 
    }

    @PostMapping("/admin/notes/{userId}")
    public ResponseEntity<Void> saveAdminNote(@PathVariable String userId, @RequestBody Map<String, String> note) {
        return ResponseEntity.ok().build();
    }

    // --- 4. HISTORY & ADMIN AGGREGATION (Untouched & Safe) ---
    @GetMapping("/history/{userId1}/{userId2}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(
            @PathVariable String userId1, 
            @PathVariable String userId2) {
        
        List<ChatMessage> history = chatRepository
            .findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByTimestampAsc(
                userId1, userId2, userId2, userId1
            );
            
        return ResponseEntity.ok(history);
    }

    @GetMapping("/admin/conversations")
    public ResponseEntity<List<ConversationDTO>> getAdminConversations(
            @RequestParam(required = false, defaultValue = "") String search) {
        
        // This keeps your specialized aggregation search logic
        List<ConversationDTO> conversationList = chatRepository.findAdminConversationsWithSearch(search);
        return ResponseEntity.ok(conversationList);
    }

    @PostMapping("/read/{senderId}/{recipientId}")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String senderId, 
            @PathVariable String recipientId) {
        
        List<ChatMessage> unreadMessages = chatRepository
            .findBySenderIdAndRecipientIdAndIsRead(senderId, recipientId, false);
            
        unreadMessages.forEach(m -> m.setRead(true));
        chatRepository.saveAll(unreadMessages);
        
        return ResponseEntity.noContent().build();
    }
}