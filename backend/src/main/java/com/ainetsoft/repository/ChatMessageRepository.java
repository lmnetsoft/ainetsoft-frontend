package com.ainetsoft.repository;

import com.ainetsoft.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    
    // Finds all messages between two specific users (Sender/Receiver)
    List<ChatMessage> findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByTimestampAsc(
        String s1, String r1, String s2, String r2
    );
}