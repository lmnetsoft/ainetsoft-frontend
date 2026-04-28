package com.ainetsoft.repository;

import com.ainetsoft.dto.ConversationDTO;
import com.ainetsoft.model.ChatMessage;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    List<ChatMessage> findByConversationIdOrderByTimestampAsc(String conversationId);

    List<ChatMessage> findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByTimestampAsc(
            String s1, String r1, String s2, String r2);

    List<ChatMessage> findBySenderIdAndRecipientIdAndIsRead(String senderId, String recipientId, boolean isRead);

    /**
     * SUPREME AGGREGATION:
     * 🚀 ĐÃ SỬA: Loại bỏ chữ 'admin' gắn cứng, dùng ?0 làm ID của người đang xem hộp thư
     */
    @Aggregation(pipeline = {
        // 1. Match all messages involving the specific user (?0)
        "{ $match: { $or: [ { 'senderId': ?0 }, { 'recipientId': ?0 } ] } }",
        
        // 2. Identify the 'otherUser' (the person they are chatting with)
        "{ $project: { " +
            "otherUser: { $cond: [ { $eq: ['$senderId', ?0] }, '$recipientId', '$senderId' ] }, " +
            "timestamp: 1, " +
            "content: 1, " +
            "isRead: 1, " +
            "senderId: 1 " +
        "} }",
        
        // 3. JOIN: Pull user data (FullName, Avatar, Tags, and updatedAt)
        "{ $lookup: { from: 'users', localField: 'otherUser', foreignField: 'email', as: 'userDetails' } }",
        "{ $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } }",
        
        // 4. SEARCH: Filter by ID or the looked-up fullName (?1)
        "{ $match: { $or: [ " +
            "{ 'otherUser': { $regex: ?1, $options: 'i' } }, " +
            "{ 'userDetails.fullName': { $regex: ?1, $options: 'i' } } " +
        "] } }",
        
        // 5. SORT: Latest messages first
        "{ $sort: { timestamp: -1 } }",
        
        // 6. GROUP: Deduplicate by user and aggregate stats
        "{ $group: { " +
            "_id: '$otherUser', " +
            "fullName: { $first: '$userDetails.fullName' }, " + 
            "avatarUrl: { $first: '$userDetails.avatarUrl' }, " +
            "userTags: { $first: '$userDetails.tags' }, " +      
            "updatedAt: { $first: '$userDetails.updatedAt' }, " + 
            "lastMessageAt: { $first: '$timestamp' }, " +
            "lastMessageContent: { $first: '$content' }, " +
            "unreadCount: { $sum: { $cond: [ " +
                "{ $and: [ { $ne: ['$senderId', ?0] }, { $eq: ['$isRead', false] } ] }, 1, 0 " +
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
            "tags: { $ifNull: ['$userTags', []] }, " + 
            "lastActiveAt: { $ifNull: ['$updatedAt', '$lastMessageAt'] }, " + 
            "_id: 0 " +
        "} }",
        
        // 8. FINAL SORT: Show most recently active conversations at the top
        "{ $sort: { lastMessageAt: -1 } }"
    })
    List<ConversationDTO> findConversationsByUserIdWithSearch(String userId, String searchTerm);
}