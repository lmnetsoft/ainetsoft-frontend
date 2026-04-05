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
     * SUPREME AGGREGATION:
     * Now joins with the 'users' collection to pull 'tags' and 'updatedAt' for the sidebar.
     */
    @Aggregation(pipeline = {
        // 1. Match all messages involving 'admin'
        "{ $match: { $or: [ { 'senderId': 'admin' }, { 'recipientId': 'admin' } ] } }",
        
        // 2. Identify the 'otherUser' (the customer or visitor)
        "{ $project: { " +
            "otherUser: { $cond: [ { $eq: ['$senderId', 'admin'] }, '$recipientId', '$senderId' ] }, " +
            "timestamp: 1, " +
            "content: 1, " +
            "isRead: 1, " +
            "senderId: 1 " +
        "} }",
        
        // 3. JOIN: Pull user data (FullName, Avatar, Tags, and updatedAt)
        "{ $lookup: { from: 'users', localField: 'otherUser', foreignField: 'email', as: 'userDetails' } }",
        "{ $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } }",
        
        // 4. SEARCH: Filter by ID or the looked-up fullName
        "{ $match: { $or: [ " +
            "{ 'otherUser': { $regex: ?0, $options: 'i' } }, " +
            "{ 'userDetails.fullName': { $regex: ?0, $options: 'i' } } " +
        "] } }",
        
        // 5. SORT: Latest messages first
        "{ $sort: { timestamp: -1 } }",
        
        // 6. GROUP: Deduplicate by user and aggregate stats
        "{ $group: { " +
            "_id: '$otherUser', " +
            "fullName: { $first: '$userDetails.fullName' }, " + 
            "avatarUrl: { $first: '$userDetails.avatarUrl' }, " +
            "userTags: { $first: '$userDetails.tags' }, " +      // 🚀 NEW: Pull tags
            "updatedAt: { $first: '$userDetails.updatedAt' }, " + // 🚀 NEW: Pull activity timestamp
            "lastMessageAt: { $first: '$timestamp' }, " +
            "lastMessageContent: { $first: '$content' }, " +
            "unreadCount: { $sum: { $cond: [ " +
                "{ $and: [ { $ne: ['$senderId', 'admin'] }, { $eq: ['$isRead', false] } ] }, 1, 0 " +
            "] } } " +
        "} }",
        
        // 7. FORMAT: Prepare output to match ConversationDTO record
        "{ $project: { " +
            "userId: '$_id', " +
            "userName: { $ifNull: [ " +
                "'$fullName', " + 
                "{ $cond: { " +
                    "if: { $regexMatch: { input: '$_id', regex: /^visitor_/ } }, " +
                    "then: 'Khách vãng lai', " +
                    "else: '$_id' " +
                "} } " +
            "] }, " +
            "userAvatar: { $ifNull: [ '$avatarUrl', '' ] }, " +
            "lastMessageAt: 1, " +
            "lastMessageContent: 1, " +
            "unreadCount: 1, " +
            "tags: { $ifNull: ['$userTags', []] }, " + // 🚀 NEW: Default to empty list if no tags
            "lastActiveAt: { $ifNull: ['$updatedAt', '$lastMessageAt'] }, " + // 🚀 NEW: Fallback to last msg time
            "_id: 0 " +
        "} }",
        
        // 8. FINAL SORT: Show most recently active conversations at the top
        "{ $sort: { lastMessageAt: -1 } }"
    })
    List<ConversationDTO> findAdminConversationsWithSearch(String searchTerm);
}