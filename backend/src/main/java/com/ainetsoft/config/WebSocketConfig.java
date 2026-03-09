package com.ainetsoft.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Frontend connects to: http://localhost:8080/ws
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:5173") // Your Vite React Port
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app"); // prefix for sending: /app/chat
        registry.enableSimpleBroker("/topic", "/queue");   // prefixes for receiving
        registry.setUserDestinationPrefix("/user");
    }
}