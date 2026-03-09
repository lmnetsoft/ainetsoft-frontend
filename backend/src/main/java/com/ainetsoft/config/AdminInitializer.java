package com.ainetsoft.config;

import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value; // Added for properties
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Pulling settings from application.properties with sensible defaults
    @Value("${admin.setup.email:admin@ainetsoft.com}")
    private String adminEmail;

    @Value("${admin.setup.password:Admin@123456}")
    private String adminPassword;

    @Value("${admin.setup.fullname:Global Administrator}")
    private String adminFullName;

    @Override
    public void run(String... args) {
        
        // Root Admin Check: Ensures you are never locked out of your own platform
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .email(adminEmail)
                    .fullName(adminFullName)
                    // Encodes the password from properties
                    .password(passwordEncoder.encode(adminPassword)) 
                    .roles(new HashSet<>(Collections.singleton("ADMIN"))) 
                    .accountStatus("ACTIVE") 
                    .sellerVerification("VERIFIED") // Admin is pre-verified
                    .enabled(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now()) // Good practice to set this too
                    .build();

            userRepository.save(admin);
            System.out.println(">>> [SEED] Global Admin initialized: " + adminEmail);
        }
    }
}