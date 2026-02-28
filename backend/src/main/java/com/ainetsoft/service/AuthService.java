package com.ainetsoft.service;

import com.ainetsoft.dto.RegisterRequest;
import com.ainetsoft.dto.LoginRequest;
import com.ainetsoft.dto.LoginResponse;
import com.ainetsoft.model.User;
import com.ainetsoft.model.PasswordResetToken;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository; // New dependency
    private final AzureCommunicationService azureService;      // New dependency
    private final PasswordEncoder passwordEncoder;

    /**
     * Registers a new user.
     */
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

    /**
     * Authenticates user.
     */
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrPhone(request.getContactInfo(), request.getContactInfo())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        if (!user.isEnabled()) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa!");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        return new LoginResponse(
            user.getFullName(), 
            user.getRoles(), 
            "Đăng nhập thành công!"
        );
    }

    /**
     * Phase 1: Generates OTP and sends it via Azure Managed Email Domain.
     */
    public String processForgotPassword(String contactInfo) {
        // 1. Check if user exists (handles email or phone lookup)
        userRepository.findByEmailOrPhone(contactInfo, contactInfo)
            .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại trong hệ thống!"));

        // 2. Generate a random 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // 3. Clear any existing tokens for this specific contact to avoid confusion
        tokenRepository.deleteByContactInfo(contactInfo);

        // 4. Save new OTP to MongoDB with 10-minute expiry
        PasswordResetToken token = PasswordResetToken.builder()
            .contactInfo(contactInfo)
            .otpCode(otp)
            .expiryDate(LocalDateTime.now().plusMinutes(10))
            .build();
        tokenRepository.save(token);

        // 5. Trigger the Azure email service
        azureService.sendResetEmail(contactInfo, otp);

        return "Mã OTP đã được gửi đến email của bạn.";
    }

    /**
     * Phase 2: Verifies the OTP and updates the password.
     */
    public String resetPassword(String contactInfo, String otp, String newPassword) {
        // 1. Verify the token exists and is valid
        PasswordResetToken token = tokenRepository.findByContactInfoAndOtpCode(contactInfo, otp)
            .orElseThrow(() -> new RuntimeException("Mã xác thực không chính xác hoặc đã hết hạn!"));

        // 2. Locate the user
        User user = userRepository.findByEmailOrPhone(contactInfo, contactInfo)
            .orElseThrow(() -> new RuntimeException("Lỗi hệ thống: Không tìm thấy người dùng."));

        // 3. Update the password with BCrypt encoding
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // 4. Cleanup: Delete the token so it can't be reused
        tokenRepository.delete(token);

        return "Mật khẩu của bạn đã được cập nhật thành công.";
    }
}