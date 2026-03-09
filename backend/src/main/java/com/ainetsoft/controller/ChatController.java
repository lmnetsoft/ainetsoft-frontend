package com.ainetsoft.controller;

import com.ainetsoft.model.ChatMessage;
import com.ainetsoft.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatRepository;

    /**
     * WebSocket Endpoint: /app/chat
     * Handles real-time message routing and saves to MongoDB.
     */
    @MessageMapping("/chat")
    public void processMessage(ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setRead(false);

        // Save to Database
        ChatMessage savedMsg = chatRepository.save(chatMessage);

        // Send to Recipient via WebSocket
        messagingTemplate.convertAndSendToUser(
            chatMessage.getRecipientId(), 
            "/queue/messages", 
            savedMsg
        );
    }

    /**
     * Loads full history between two users for the ChatPage UI.
     */
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

    /**
     * NEW: Admin Discovery Endpoint.
     * Identifies all users who have messaged the 'admin' account.
     */
    @GetMapping("/admin/conversations")
    public ResponseEntity<List<String>> getAdminConversations() {
        List<String> userIds = chatRepository.findAll().stream()
                .filter(m -> "admin".equals(m.getRecipientId()) || "admin".equals(m.getSenderId()))
                .map(m -> "admin".equals(m.getSenderId()) ? m.getRecipientId() : m.getSenderId())
                .distinct()
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(userIds);
    }
}