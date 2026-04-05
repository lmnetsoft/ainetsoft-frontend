package com.ainetsoft.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ConversationDTO(
    String userId, 
    String userName, 
    String userAvatar, 
    LocalDateTime lastMessageAt,
    String lastMessageContent,
    long unreadCount,
    List<String> tags,         // 🚀 NEW: Added to support tag pills in the sidebar
    LocalDateTime lastActiveAt // 🚀 NEW: Added to fix the Online/Offline status indicator
) {}