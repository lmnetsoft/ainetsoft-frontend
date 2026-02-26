package com.ainetsoft.service;

import com.ainetsoft.dto.RegisterRequest;
import com.ainetsoft.dto.LoginRequest;
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
        String email = (request.getEmail() == null || request.getEmail().isBlank()) ? null : request.getEmail();
        String phone = (request.getPhone() == null || request.getPhone().isBlank()) ? null : request.getPhone();

        if (email != null && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }

        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new RuntimeException("Số điện thoại này đã được sử dụng!");
        }

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

    public String login(LoginRequest request) {
        User user = userRepository.findByEmailOrPhone(request.getContactInfo(), request.getContactInfo())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        if (!user.isEnabled()) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa!");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        return "Đăng nhập thành công!";
    }
}