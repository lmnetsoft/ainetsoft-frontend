package com.ainetsoft.service;

import com.ainetsoft.dto.*;
import com.ainetsoft.model.User;
import com.ainetsoft.model.CartItem;
import com.ainetsoft.model.PasswordResetToken;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final AzureCommunicationService azureService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Helper: Normalizes phone numbers to a clean numeric-only format.
     */
    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        return phone.replaceAll("[^0-9]", "");
    }

    /**
     * Helper: Centralized logic to normalize the contact info (Email or Phone).
     * This ensures +84987... becomes 84987... to match your DB record.
     */
    private String normalizeIdentifier(String identifier) {
        if (identifier == null) return null;
        String trimmed = identifier.trim();
        // If it contains digits, treat as a phone number
        if (trimmed.matches(".*\\d.*")) {
            return normalizePhone(trimmed);
        }
        return trimmed.toLowerCase();
    }

    public UserResponse getUserProfile(String contactInfo) {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        return UserResponse.builder()
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .gender(user.getGender())
                .birthDate(user.getBirthDate())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles())
                .provider(user.getProvider() != null ? user.getProvider().toString() : "LOCAL")
                .addresses(user.getAddresses() != null ? user.getAddresses() : new ArrayList<>())
                .bankAccounts(user.getBankAccounts() != null ? user.getBankAccounts() : new ArrayList<>())
                .cart(user.getCart() != null ? user.getCart() : new ArrayList<>())
                .build();
    }

    public String updateProfile(String contactInfo, UpdateProfileRequest request) {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            boolean isSocialUser = user.getProvider() != null && 
                                  !user.getProvider().toString().equalsIgnoreCase("LOCAL");

            if (!isSocialUser) {
                String newEmail = request.getEmail().trim().toLowerCase();
                if (!newEmail.equals(user.getEmail())) {
                    if (userRepository.existsByEmail(newEmail)) {
                        throw new RuntimeException("Email '" + newEmail + "' đã được sử dụng bởi tài khoản khác!");
                    }
                    user.setEmail(newEmail);
                }
            } else {
                log.info("Blocking email update for social account: {}", user.getEmail());
            }
        }

        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getBirthDate() != null) user.setBirthDate(request.getBirthDate());
        
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(normalizePhone(request.getPhone()));
        }

        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());

        if (request.getAddresses() != null) {
            request.getAddresses().forEach(addr -> {
                if (addr.getPhone() != null) addr.setPhone(normalizePhone(addr.getPhone()));
            });
            user.setAddresses(request.getAddresses());
        }

        if (request.getBankAccounts() != null) user.setBankAccounts(request.getBankAccounts());

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return "Cập nhật hồ sơ thành công!";
    }

    public String register(RegisterRequest request) {
        validatePasswordStrength(request.getPassword());
        String email = (request.getEmail() == null || request.getEmail().isBlank()) ? null : request.getEmail().trim().toLowerCase();
        String phone = normalizePhone(request.getPhone());

        if (email != null && userRepository.existsByEmail(email)) throw new RuntimeException("Email đã tồn tại!");
        if (phone != null && userRepository.existsByPhone(phone)) throw new RuntimeException("SĐT đã tồn tại!");

        User user = User.builder()
                .email(email)
                .phone(phone)
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Collections.singleton("USER")))
                .enabled(true)
                .cart(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        if (email != null) {
            try {
                azureService.sendWelcomeEmail(email, user.getFullName());
            } catch (Exception e) {
                log.error("Welcome email failed for {}: {}", email, e.getMessage());
            }
        }
        return "Đăng ký thành công!";
    }

    public LoginResponse login(LoginRequest request) {
        String identifier = normalizeIdentifier(request.getContactInfo());

        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        return new LoginResponse(user.getFullName(), user.getRoles(), "Đăng nhập thành công!");
    }

    public String changePassword(String contactInfo, ChangePasswordRequest request) {
        validatePasswordStrength(request.getNewPassword());
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (!passwordEncoder.matches(request.getCurrentPassword().trim(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return "Mật khẩu đã được thay đổi thành công!";
    }

    public String processForgotPassword(String contactInfo) {
        String identifier = normalizeIdentifier(contactInfo);
        userRepository.findByIdentifier(identifier)
            .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        String otp = String.format("%06d", new Random().nextInt(999999));
        tokenRepository.deleteByContactInfo(identifier);

        PasswordResetToken token = PasswordResetToken.builder()
            .contactInfo(identifier)
            .otpCode(otp)
            .expiryDate(LocalDateTime.now().plusMinutes(10))
            .build();
        tokenRepository.save(token);

        try {
            azureService.sendResetEmail(identifier, otp);
            return "Mã OTP đã được gửi đến email của bạn.";
        } catch (Exception e) {
            throw new RuntimeException("Lỗi hệ thống khi gửi email. Vui lòng thử lại sau.");
        }
    }

    public String resetPassword(String contactInfo, String otp, String newPassword) {
        validatePasswordStrength(newPassword);
        String identifier = normalizeIdentifier(contactInfo);
        PasswordResetToken token = tokenRepository.findByContactInfoAndOtpCode(identifier, otp)
            .orElseThrow(() -> new RuntimeException("Mã xác thực không chính xác hoặc đã hết hạn!"));

        User user = userRepository.findByIdentifier(identifier)
            .orElseThrow(() -> new RuntimeException("Lỗi hệ thống!"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        tokenRepository.delete(token);

        return "Mật khẩu của bạn đã được cập nhật thành công.";
    }

    /**
     * UPDATED: Enhanced Password Validation
     * Requirements: 
     * 1. At least 8 characters long.
     * 2. Must contain at least one letter (a-z, A-Z).
     */
    private void validatePasswordStrength(String password) {
        if (password == null || password.trim().length() < 8) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 8 ký tự!");
        }
        
        // Regex: Check if the string contains at least one letter
        if (!password.matches(".*[a-zA-Z].*")) {
            throw new RuntimeException("Mật khẩu phải chứa ít nhất một chữ cái!");
        }
    }

    public String syncCart(String contactInfo, List<CartItem> cartItems) {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        
        user.setCart(cartItems != null ? cartItems : new ArrayList<>());
        userRepository.save(user);
        return "Giỏ hàng đã được đồng bộ.";
    }

    public String upgradeToSeller(String contactInfo) {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        Set<String> roles = user.getRoles();
        if (roles == null) roles = new HashSet<>();
        else roles = new HashSet<>(roles);

        if (roles.contains("SELLER")) return "Bạn đã là Người bán rồi!";

        roles.add("SELLER");
        user.setRoles(roles);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return "Chúc mừng! Bạn đã trở thành Người bán thành công.";
    }
}