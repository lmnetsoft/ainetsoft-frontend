package com.ainetsoft.controller;

import com.ainetsoft.dto.ConversationDTO;
import com.ainetsoft.model.ChatMessage;
import com.ainetsoft.repository.ChatMessageRepository;
import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.nio.JpegWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
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
    private final Path rootLocation = Paths.get("uploads");

    // --- 1. WEBSOCKET LOGIC ---
    @MessageMapping("/chat")
    public void processMessage(ChatMessage chatMessage, Principal principal) {
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

    // --- 2. FILE UPLOAD (With Scrimage HEIC to JPG Conversion) ---
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file, Principal principal) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
            }
            
            String fileName = UUID.randomUUID().toString();
            
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }

            // HEIC/HEIF Conversion Logic using SCRIMAGE
            if (extension.equals(".heic") || extension.equals(".heif")) {
                fileName += ".jpg";
                Path destination = rootLocation.resolve(fileName);
                
                // FIX: Changed .write() to .output() for Scrimage 4.x compatibility
                ImmutableImage.loader()
                    .fromBytes(file.getBytes())
                    .output(JpegWriter.Default, destination);
            } else {
                // Normal upload for JPG, PNG, MP4, etc.
                fileName += extension;
                Files.copy(file.getInputStream(), rootLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }

            // Return the download-specific URL
            String fileUrl = "http://localhost:8080/api/chat/download/" + fileName;
            return ResponseEntity.ok(Map.of("url", fileUrl));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Processing failed: " + e.getMessage()));
        }
    }

    // --- 3. FILE DOWNLOAD ENDPOINT ---
    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Path file = rootLocation.resolve(fileName);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // --- 4. HISTORY & ADMIN AGGREGATION ---
    @GetMapping("/history/{userId1}/{userId2}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable String userId1, @PathVariable String userId2) {
        List<ChatMessage> history = chatRepository.findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByTimestampAsc(userId1, userId2, userId2, userId1);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/admin/conversations")
    public ResponseEntity<List<ConversationDTO>> getAdminConversations(@RequestParam(required = false, defaultValue = "") String search) {
        return ResponseEntity.ok(chatRepository.findAdminConversationsWithSearch(search));
    }

    @PostMapping("/read/{senderId}/{recipientId}")
    public ResponseEntity<Void> markAsRead(@PathVariable String senderId, @PathVariable String recipientId) {
        List<ChatMessage> unreadMessages = chatRepository.findBySenderIdAndRecipientIdAndIsRead(senderId, recipientId, false);
        unreadMessages.forEach(m -> m.setRead(true));
        chatRepository.saveAll(unreadMessages);
        return ResponseEntity.noContent().build();
    }
}