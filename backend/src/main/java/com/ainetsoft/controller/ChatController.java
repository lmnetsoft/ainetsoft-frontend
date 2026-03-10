package com.ainetsoft.controller;

import com.ainetsoft.dto.ConversationDTO;
import com.ainetsoft.model.ChatMessage;
import com.ainetsoft.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatRepository;

    @MessageMapping("/chat")
    public void processMessage(ChatMessage chatMessage, Principal principal) {
        // SECURITY: Ensure the senderId is actually the logged-in user
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
        
        // This now returns Name and Avatar thanks to the updated aggregation
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