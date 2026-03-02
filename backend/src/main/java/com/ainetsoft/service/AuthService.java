package com.ainetsoft.service;

import com.ainetsoft.dto.*;
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
    private final PasswordResetTokenRepository tokenRepository;
    private final AzureCommunicationService azureService;
    private final PasswordEncoder passwordEncoder;

    private void validatePasswordStrength(String password) {
        if (password == null || password.trim().length() < 8) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 8 ký tự!");
        }
    }

    /**
     * UPDATED: Now includes dynamic Bank and Address lists in the response.
     */
    public UserResponse getUserProfile(String contactInfo) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        return UserResponse.builder()
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .gender(user.getGender())
                .birthDate(user.getBirthDate())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles())
                // NEW: Send lists back to Frontend
                .addresses(user.getAddresses())
                .bankAccounts(user.getBankAccounts())
                .build();
    }

    /**
     * UPDATED: Saves dynamic Bank and Address data into MongoDB.
     */
    public String updateProfile(String contactInfo, UpdateProfileRequest request) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        // Update core fields
        user.setFullName(request.getFullName());
        user.setGender(request.getGender());
        user.setBirthDate(request.getBirthDate());
        
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        // NEW DYNAMIC CAPABILITY: Update Embedded Bank & Address Lists
        if (request.getAddresses() != null) {
            user.setAddresses(request.getAddresses());
        }

        if (request.getBankAccounts() != null) {
            user.setBankAccounts(request.getBankAccounts());
        }

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return "Cập nhật hồ sơ thành công!";
    }

    /* ... login, register, resetPassword methods remain unchanged ... */
    
    public String changePassword(String contactInfo, ChangePasswordRequest request) {
        validatePasswordStrength(request.getNewPassword());
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        boolean isMatch = passwordEncoder.matches(request.getCurrentPassword().trim(), user.getPassword());
        if (!isMatch) throw new RuntimeException("Mật khẩu hiện tại không chính xác!");

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return "Mật khẩu đã được thay đổi thành công!";
    }

    public String register(RegisterRequest request) {
        validatePasswordStrength(request.getPassword());
        String email = (request.getEmail() == null || request.getEmail().isBlank()) ? null : request.getEmail();
        String phone = (request.getPhone() == null || request.getPhone().isBlank()) ? null : request.getPhone();

        if (email != null && userRepository.existsByEmail(email)) throw new RuntimeException("Email đã tồn tại!");
        if (phone != null && userRepository.existsByPhone(phone)) throw new RuntimeException("SĐT đã tồn tại!");

        User user = User.builder()
                .email(email).phone(phone)
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(Collections.singleton("USER"))
                .enabled(true)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        return "Đăng ký thành công!";
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByIdentifier(request.getContactInfo())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        return new LoginResponse(user.getFullName(), user.getRoles(), "Đăng nhập thành công!");
    }

    public String processForgotPassword(String contactInfo) {
        userRepository.findByIdentifier(contactInfo)
            .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        String otp = String.format("%06d", new Random().nextInt(999999));
        tokenRepository.deleteByContactInfo(contactInfo);

        PasswordResetToken token = PasswordResetToken.builder()
            .contactInfo(contactInfo)
            .otpCode(otp)
            .expiryDate(LocalDateTime.now().plusMinutes(10))
            .build();
        tokenRepository.save(token);

        azureService.sendResetEmail(contactInfo, otp);
        return "Mã OTP đã được gửi đến email của bạn.";
    }

    public String resetPassword(String contactInfo, String otp, String newPassword) {
        validatePasswordStrength(newPassword);
        PasswordResetToken token = tokenRepository.findByContactInfoAndOtpCode(contactInfo, otp)
            .orElseThrow(() -> new RuntimeException("Mã xác thực không chính xác hoặc đã hết hạn!"));

        User user = userRepository.findByIdentifier(contactInfo)
            .orElseThrow(() -> new RuntimeException("Lỗi hệ thống!"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        tokenRepository.delete(token);

        return "Mật khẩu của bạn đã được cập nhật thành công.";
    }
}