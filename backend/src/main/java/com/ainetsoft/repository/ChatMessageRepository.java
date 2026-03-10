package com.ainetsoft.repository;

import com.ainetsoft.dto.ConversationDTO;
import com.ainetsoft.model.ChatMessage;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    List<ChatMessage> findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByTimestampAsc(
            String s1, String r1, String s2, String r2);

    List<ChatMessage> findBySenderIdAndRecipientIdAndIsRead(String senderId, String recipientId, boolean isRead);

    /**
     * HIGH-PERFORMANCE AGGREGATION (PROFESSIONAL VERSION)
     * Joins chat messages with the users collection to provide Names and Photos.
     */
    @Aggregation(pipeline = {
        // 1. Match all messages involving 'admin'
        "{ $match: { $or: [ { 'senderId': 'admin' }, { 'recipientId': 'admin' } ] } }",
        
        // 2. Identify the 'otherUser' (the customer/seller)
        "{ $project: { " +
            "otherUser: { $cond: [ { $eq: ['$senderId', 'admin'] }, '$recipientId', '$senderId' ] }, " +
            "timestamp: 1, " +
            "content: 1, " +
            "isRead: 1, " +
            "senderId: 1 " +
        "} }",
        
        // 3. JOIN: Match 'otherUser' (email) against the 'email' field in the users collection
        "{ $lookup: { from: 'users', localField: 'otherUser', foreignField: 'email', as: 'userDetails' } }",
        "{ $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } }",
        
        // 4. SEARCH: Filter by email OR the looked-up fullName
        "{ $match: { $or: [ " +
            "{ 'otherUser': { $regex: ?0, $options: 'i' } }, " +
            "{ 'userDetails.fullName': { $regex: ?0, $options: 'i' } } " +
        "] } }",
        
        // 5. SORT: Descending time to get the latest message details first
        "{ $sort: { timestamp: -1 } }",
        
        // 6. GROUP: Deduplicate and capture the newest Name and Avatar
        "{ $group: { " +
            "_id: '$otherUser', " +
            "fullName: { $first: '$userDetails.fullName' }, " + 
            "avatarUrl: { $first: '$userDetails.avatarUrl' }, " + // Capture the photo URL
            "lastMessageAt: { $first: '$timestamp' }, " +
            "lastMessageContent: { $first: '$content' }, " +
            "unreadCount: { $sum: { $cond: [ " +
                "{ $and: [ { $ne: ['$senderId', 'admin'] }, { $eq: ['$isRead', false] } ] }, 1, 0 " +
            "] } } " +
        "} }",
        
        // 7. FORMAT: Prepare the DTO with fallbacks
        "{ $project: { " +
            "userId: '$_id', " +
            "userName: { $ifNull: [ '$fullName', { $cond: [ { $eq: ['$_id', 'guest'] }, 'Khách vãng lai', '$_id' ] } ] }, " +
            "userAvatar: { $ifNull: [ '$avatarUrl', '' ] }, " + // Handle missing avatars
            "lastMessageAt: 1, " +
            "lastMessageContent: 1, " +
            "unreadCount: 1, " +
            "_id: 0 " +
        "} }",
        
        // 8. FINAL SORT: Order the sidebar newest-first
        "{ $sort: { lastMessageAt: -1 } }"
    })
    List<ConversationDTO> findAdminConversationsWithSearch(String searchTerm);
}