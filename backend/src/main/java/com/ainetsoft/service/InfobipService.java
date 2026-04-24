package com.ainetsoft.service;

import lombok.extern.slf4j.Slf4j; // 🚀 Use Slf4j for professional logging
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException; // 🚀 Capture specific API errors
import org.springframework.http.*;
import java.util.*;

@Slf4j
@Service
public class InfobipService {
    @Value("${infobip.api.key}") 
    private String apiKey;

    @Value("${infobip.base.url}") 
    private String baseUrl;

    @Value("${infobip.sender-id}") 
    private String senderId;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendSms(String to, String message) {
        String url = "https://" + baseUrl + "/sms/2/text/advanced";
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "App " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        Map<String, Object> destination = new HashMap<>();
        destination.put("to", to);
        
        Map<String, Object> messageObj = new HashMap<>();
        messageObj.put("from", senderId);
        messageObj.put("destinations", Collections.singletonList(destination));
        messageObj.put("text", message);

        body.put("messages", Collections.singletonList(messageObj));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            log.info("Infobip success: {}", response.getBody()); // 🚀 See the exact status
        } catch (HttpStatusCodeException e) {
            // 🚀 This prints the REAL error from Infobip (e.g. "REJECTED_SENDER_ID")
            log.error("Infobip API Error: {} - Body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Infobip Error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Infobip Connection Error: {}", e.getMessage());
            throw new RuntimeException("Failed to connect to Infobip: " + e.getMessage());
        }
    }
}