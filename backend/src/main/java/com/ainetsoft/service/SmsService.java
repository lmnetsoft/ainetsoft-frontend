package com.ainetsoft.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class SmsService {
    @Value("${infobip.api.key}") private String apiKey;
    @Value("${infobip.base.url}") private String baseUrl;
    @Value("${infobip.sender-id}") private String senderId;

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
        restTemplate.postForEntity(url, entity, String.class);
    }
}