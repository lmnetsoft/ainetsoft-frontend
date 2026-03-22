package com.ainetsoft.dto;

import java.time.LocalDateTime;

public record ConversationDTO(
    String userId, 
    String userName, 
    String userAvatar, // NEW: Added to support user photos in Admin list
    LocalDateTime lastMessageAt,
    String lastMessageContent,
    long unreadCount
    
) {}