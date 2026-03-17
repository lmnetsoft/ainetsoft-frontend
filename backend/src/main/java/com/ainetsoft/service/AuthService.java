package com.ainetsoft.service;

import com.ainetsoft.config.JwtUtils;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
    private final JwtUtils jwtUtils;
    
    // Injected service for reusable file operations
    private final FileStorageService fileStorageService;

    // Directory for file storage
    private final String UPLOAD_DIR = "uploads/cccd/";

    /**
     * Helper to save files to the local disk.
     */
    private String saveFile(MultipartFile file, String userId, String side) throws IOException {
        if (file == null || file.isEmpty()) return null;

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Create a unique filename: userId_front_timestamp.jpg
        String originalName = file.getOriginalFilename();
        String extension = (originalName != null && originalName.contains(".")) 
                ? originalName.substring(originalName.lastIndexOf(".")) : ".jpg";
        
        String fileName = userId + "_" + side + "_" + System.currentTimeMillis() + extension;
        
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        return "/api/uploads/cccd/" + fileName; // Return the URL path
    }

    /**
     * Vietnamese & Global Phone Validation
     */
    private boolean isValidPhone(String phone) {
        if (phone == null || phone.isBlank()) return true;
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        if (cleanPhone.startsWith("0") || cleanPhone.startsWith("84")) {
            String vnNormalized = cleanPhone.startsWith("84") ? "0" + cleanPhone.substring(2) : cleanPhone;
            String vnRegex = "^(03[2-9]|086|09[6-8]|070|07[6-9]|089|090|093|08[1-5]|088|091|094|052|05[68]|092|059|099)\\d{7}$";
            if (vnNormalized.matches(vnRegex)) return true;
            throw new RuntimeException("Số điện thoại Việt Nam không thuộc nhà mạng được hỗ trợ!");
        }
        return cleanPhone.matches("^\\d{7,15}$");
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        return phone.replaceAll("[^0-9]", "");
    }

    private String normalizeIdentifier(String identifier) {
        if (identifier == null) return null;
        String trimmed = identifier.trim();
        if (trimmed.contains("@")) return trimmed.toLowerCase();
        return normalizePhone(trimmed);
    }

    public UserResponse getUserProfile(String contactInfo) {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Tài khoản '" + contactInfo + "' không tồn tại!"));

        String displayName = user.getFullName();
        if (displayName == null || displayName.isBlank()) {
            displayName = (user.getEmail() != null) ? user.getEmail().split("@")[0] : "Thành viên";
        }

        return UserResponse.builder()
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(displayName)
                .gender(user.getGender())
                .birthDate(user.getBirthDate())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles())
                .isGlobalAdmin(user.isGlobalAdmin())
                .permissions(user.getPermissions() != null ? user.getPermissions() : new HashSet<>())
                .provider(user.getProvider() != null ? user.getProvider().toString() : "LOCAL")
                .shopProfile(user.getShopProfile()) 
                .addresses(user.getAddresses() != null ? user.getAddresses() : new ArrayList<>())
                .bankAccounts(user.getBankAccounts() != null ? (List)user.getBankAccounts() : new ArrayList<>())
                .cart(user.getCart() != null ? user.getCart() : new ArrayList<>())
                .sellerVerification(user.getSellerVerification())
                .rejectionReason(user.getRejectionReason())
                .build();
    }

    @Transactional
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
            }
        }

        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getBirthDate() != null) user.setBirthDate(request.getBirthDate());
        
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String newPhone = normalizePhone(request.getPhone());
            if (!newPhone.equals(user.getPhone())) {
                if (userRepository.existsByPhone(newPhone)) {
                    throw new RuntimeException("Số điện thoại này đã được sử dụng!");
                }
                user.setPhone(newPhone);
            }
        }

        // --- FIXED: Ensures the moderation list sees the photo ---
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        if (request.getShopProfile() != null) {
            user.setShopProfile(request.getShopProfile());
        }

        if (request.getAddresses() != null) user.setAddresses(request.getAddresses());
        if (request.getBankAccounts() != null) {
            user.setBankAccounts((List)request.getBankAccounts());
        }

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
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        return "Đăng ký thành công!";
    }

    public LoginResponse login(LoginRequest request) {
        String identifier = normalizeIdentifier(request.getContactInfo());
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        String token = jwtUtils.generateToken(identifier, user.getRoles()); 

        return LoginResponse.builder()
                .token(token)
                .fullName(user.getFullName())
                .roles(user.getRoles())
                .isGlobalAdmin(user.isGlobalAdmin())
                .permissions(user.getPermissions() != null ? user.getPermissions() : new HashSet<>())
                .message("Đăng nhập thành công!")
                .build();
    }

    @Transactional
    public String upgradeToSeller(String contactInfo, SellerRegistrationDTO dto, MultipartFile front, MultipartFile back) {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        
        if (user.getRoles() != null && user.getRoles().contains("SELLER")) {
            return "Bạn đã là Người bán rồi!";
        }

        String providedEmail = (dto.getEmail() != null) ? dto.getEmail().trim().toLowerCase() : null;
        if (providedEmail == null || providedEmail.isEmpty()) {
            throw new RuntimeException("Email là bắt buộc để đăng ký làm Người bán! (Hệ thống cần gửi đối soát)");
        }

        Optional<User> existingEmailUser = userRepository.findByEmail(providedEmail);
        if (existingEmailUser.isPresent() && !existingEmailUser.get().getId().equals(user.getId())) {
            throw new RuntimeException("Email '" + providedEmail + "' đã được sử dụng bởi một tài khoản khác!");
        }
        
        user.setEmail(providedEmail);

        try {
            // 1. Save CCCD Images using FileStorageService
            String frontUrl = fileStorageService.saveFile(front, "cccd");
            String backUrl = fileStorageService.saveFile(back, "cccd");

            // 2. Map Identity Info
            user.setIdentityInfo(User.IdentityInfo.builder()
                    .cccdNumber(dto.getCccdNumber())
                    .frontImageUrl(frontUrl)
                    .backImageUrl(backUrl)
                    .submittedAt(LocalDateTime.now())
                    .build());

            // 3. Map Shop Profile
            user.setShopProfile(User.ShopProfile.builder()
                    .shopName(dto.getShopName())
                    .shopAddress(dto.getShopAddress())
                    .taxCode(dto.getTaxCode()) 
                    .businessPhone(dto.getPhone() != null ? normalizePhone(dto.getPhone()) : user.getPhone())
                    .build());

            // 4. Map Bank Account
            List<User.BankInfo> banks = new ArrayList<>();
            banks.add(User.BankInfo.builder()
                    .bankName(dto.getBankName())
                    .accountNumber(dto.getAccountNumber())
                    .accountHolder(dto.getAccountHolder().toUpperCase())
                    .isDefault(true)
                    .build());
            user.setBankAccounts(banks);

            // 5. Update Status
            user.setSellerVerification("PENDING");
            user.setAccountStatus("PENDING_SELLER");
            user.setUpdatedAt(LocalDateTime.now());
            
            userRepository.save(user);
            log.info("Upgrade request received. User ID: {}, Identifier: {}, Email: {}", user.getId(), identifier, providedEmail);
            
            return "Hồ sơ đã được gửi! Admin sẽ phản hồi qua email: " + providedEmail;
            
        } catch (Exception e) {
            log.error("File upload error: {}", e.getMessage());
            throw new RuntimeException("Lỗi khi lưu hồ sơ: " + e.getMessage());
        }
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

        // --- AZURE CALL TEMPORARILY DISABLED FOR COMPILATION ---
        // Restore this once sendEmail is made public in AzureCommunicationService
        // azureService.sendEmail(identifier, "OTP Reset", otp);

        log.info("OTP generated for {}: {}", identifier, otp);
        return "Mã OTP đã được tạo.";
    }
    
    public Map<String, Object> toggleFavorite(String productId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        Set<String> favorites = user.getFavoriteProductIds();
        if (favorites == null) favorites = new HashSet<>();

        boolean isNowLiked;
        if (favorites.contains(productId)) {
            favorites.remove(productId);
            isNowLiked = false;
        } else {
            favorites.add(productId);
            isNowLiked = true;
        }

        user.setFavoriteProductIds(favorites);
        userRepository.save(user);

        return Map.of(
            "productId", productId,
            "isLiked", isNowLiked,
            "totalFavorites", favorites.size()
        );
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
        return "Mật khẩu đã được cập nhật.";
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.trim().length() < 8) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 8 ký tự!");
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
}