package com.ainetsoft.service;

import com.ainetsoft.dto.RegisterRequest;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public String register(RegisterRequest request) {
        
        // 1. Normalize inputs: Convert empty strings to NULL
        String email = (request.getEmail() == null || request.getEmail().isBlank()) ? null : request.getEmail();
        String phone = (request.getPhone() == null || request.getPhone().isBlank()) ? null : request.getPhone();

        // 2. Check Email uniqueness ONLY if not null
        if (email != null && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }

        // 3. Check Phone uniqueness ONLY if not null
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new RuntimeException("Số điện thoại này đã được sử dụng!");
        }

        // 4. Build User with NULLS instead of empty strings
        User user = User.builder()
                .email(email)
                .phone(phone)
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword())) 
                .roles(Collections.singleton("USER"))
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        
        return "Đăng ký thành công!";
    }
}