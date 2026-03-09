package com.ainetsoft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "chat_messages")
public class ChatMessage {
    @Id
    private String id;
    private String senderId;    // Username or Email of the sender
    private String recipientId; // Username or Email of the receiver
    private String content;
    
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    @Builder.Default
    private boolean isRead = false;
}