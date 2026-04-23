package com.ainetsoft.service;

import com.ainetsoft.config.JwtUtils;
import com.ainetsoft.config.VietnamProvinceConfig;
import com.ainetsoft.dto.*;
import com.ainetsoft.model.User;
import com.ainetsoft.model.CartItem;
import com.ainetsoft.model.BankAccount;
import com.ainetsoft.model.PasswordResetToken;
import com.ainetsoft.model.PhoneOtp;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.PasswordResetTokenRepository;
import com.ainetsoft.repository.BankAccountRepository;
import com.ainetsoft.repository.PhoneOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PhoneOtpRepository phoneOtpRepository;
    private final AzureCommunicationService azureService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final AzureOCRService ocrService;
    private final BankAccountRepository bankAccountRepository;
    private final EncryptionService encryptionService;
    
    private final String UPLOAD_DIR = "uploads/cccd/";
    private final String LICENSE_DIR = "uploads/license/";
    private final String LOGO_DIR = "uploads/logo/"; 

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.otp.expiration-minutes}")
    private int otpExpirationMinutes;

    /* --- 🛡️ OCR Identity Verification --- */
    public AzureOCRService.IdAnalysisResult verifyOCR(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new RuntimeException("Vui lòng cung cấp ảnh định danh.");
        }
        return ocrService.analyzeIdDocument(image);
    }

    /* --- Helper Methods for Slugs and Files --- */
    private String generateSlug(String input) {
        if (input == null || input.isEmpty()) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("")
                .toLowerCase()
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private String generateUniqueSlug(String shopName, String userId) {
        String baseSlug = generateSlug(shopName);
        if (baseSlug.isEmpty()) baseSlug = "shop-" + System.currentTimeMillis();
        String finalSlug = baseSlug;
        int count = 1;
        while (true) {
            Optional<User> existing = userRepository.findByShopProfile_ShopSlug(finalSlug);
            if (existing.isEmpty() || existing.get().getId().equals(userId)) {
                return finalSlug;
            }
            finalSlug = baseSlug + "-" + count++;
        }
    }

    private String saveFile(MultipartFile file, String userId, String type) throws IOException {
        if (file == null || file.isEmpty()) return null;
        
        String targetDir;
        if ("license".equals(type)) targetDir = LICENSE_DIR;
        else if ("logo".equals(type)) targetDir = LOGO_DIR; 
        else targetDir = UPLOAD_DIR;

        Path uploadPath = Paths.get(targetDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String originalName = file.getOriginalFilename();
        String extension = (originalName != null && originalName.contains(".")) 
                ? originalName.substring(originalName.lastIndexOf(".")) : ".jpg";
        String fileName = userId + "_" + type + "_" + System.currentTimeMillis() + extension;
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);
        return "/api/" + targetDir + fileName;
    }

    /* --- Phone Normalization Gatekeeper --- */
    private boolean isValidPhone(String phone) {
        if (phone == null || phone.isBlank()) return false;
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        String normalized = cleanPhone.startsWith("84") ? "0" + cleanPhone.substring(2) : cleanPhone;
        String vnRegex = "^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\\d{7}$";
        return normalized.matches(vnRegex);
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String clean = phone.replaceAll("[^0-9]", "");
        return clean.startsWith("84") ? "0" + clean.substring(2) : clean;
    }

    private String formatToE164(String phone) {
        String clean = phone.replaceAll("[^0-9]", "");
        if (clean.startsWith("0")) return "+84" + clean.substring(1);
        if (clean.startsWith("84") && !phone.startsWith("+")) return "+" + clean;
        return phone.startsWith("+") ? phone : "+" + phone;
    }

    private String normalizeIdentifier(String identifier) {
        if (identifier == null) return null;
        String trimmed = identifier.trim();
        if (trimmed.contains("@")) return trimmed.toLowerCase();
        return normalizePhone(trimmed);
    }

    /* --- User Profile Management --- */
    public UserResponse getUserProfile(String contactInfo) {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Tài khoản '" + contactInfo + "' không tồn tại!"));

        String displayName = user.getFullName();
        if (displayName == null || displayName.isBlank()) {
            displayName = (user.getEmail() != null) ? user.getEmail().split("@")[0] : "Thành viên";
        }

        return UserResponse.builder()
                .id(user.getId()) 
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
                .identityInfo(user.getIdentityInfo()) 
                .addresses(user.getAddresses() != null ? user.getAddresses() : new ArrayList<>())
                .cart(user.getCart() != null ? user.getCart() : new ArrayList<>())
                .sellerVerification(user.getSellerVerification())
                .rejectionReason(user.getRejectionReason())
                .hasPendingUpdate(user.isHasPendingUpdate()) 
                .pendingBankAccount(user.getPendingBankAccount())
                .emailVerified(user.isEmailVerified()) 
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
                        throw new RuntimeException("Email '" + newEmail + "' đã được sử dụng!");
                    }
                }
            }
        }

        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getBirthDate() != null) user.setBirthDate(request.getBirthDate());
        
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String newE164 = formatToE164(request.getPhone());
            if (!newE164.equals(user.getPhone())) {
                if (userRepository.existsByPhone(newE164)) {
                    throw new RuntimeException("Số điện thoại này đã được sử dụng!");
                }
                user.setPhone(newE164);
            }
        }

        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getShopProfile() != null) user.setShopProfile(request.getShopProfile());
        if (request.getAddresses() != null) user.setAddresses(request.getAddresses());

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return "Cập nhật hồ sơ thành công!";
    }

    /* -----------------------------------------------------------
     * 🚀 SHOPEE-STYLE VERIFIED REGISTRATION
     * ----------------------------------------------------------- */
    @Transactional
    public String register(RegisterRequest request) {
        validatePasswordStrength(request.getPassword());
        
        String email = (request.getEmail() == null || request.getEmail().isBlank()) ? null : request.getEmail().trim().toLowerCase();
        String rawPhone = request.getPhone();
        String normalizedPhone = normalizePhone(rawPhone); 
        String e164Phone = (rawPhone != null) ? formatToE164(rawPhone) : null; 
        
        if (email != null && userRepository.existsByEmail(email)) throw new RuntimeException("Email đã tồn tại!");
        if (e164Phone != null && userRepository.existsByPhone(e164Phone)) throw new RuntimeException("Số điện thoại đã tồn tại!");

        if (normalizedPhone != null) {
            if (request.getOtp() == null || request.getOtp().isBlank()) throw new RuntimeException("Vui lòng nhập mã OTP để xác thực SĐT.");
            if (!verifyPhoneOtp(normalizedPhone, request.getOtp())) throw new RuntimeException("Mã OTP không chính xác hoặc đã hết hạn.");
        }

        String verificationToken = (email != null) ? UUID.randomUUID().toString() : null;

        User user = User.builder()
                .email(email)
                .phone(e164Phone)
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Collections.singleton("USER")))
                .provider(User.AuthProvider.LOCAL)
                .enabled(e164Phone != null) // Phone verified accounts are enabled immediately
                .phoneVerified(e164Phone != null)
                .emailVerified(false)
                .verificationToken(verificationToken)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        if (email != null) {
            String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
            try {
                azureService.sendVerificationEmail(email, user.getFullName(), verificationLink);
                if (e164Phone != null) return "Đăng ký thành công! Đăng nhập ngay bằng SĐT. Hãy kiểm tra email sau để xác thực hòm thư.";
                return "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt.";
            } catch (Exception e) {
                log.error("Email send failed: {}", e.getMessage());
            }
        }
        return "Đăng ký thành công!";
    }

    public LoginResponse login(LoginRequest request) {
        String identifier = normalizeIdentifier(request.getContactInfo());
        User user = userRepository.findByIdentifier(identifier).orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));
        if (!user.isEnabled()) throw new RuntimeException("Tài khoản chưa kích hoạt.");
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) throw new RuntimeException("Sai mật khẩu!");

        String token = jwtUtils.generateToken(identifier, user.getRoles()); 
        return LoginResponse.builder().token(token).fullName(user.getFullName()).roles(user.getRoles()).message("Đăng nhập thành công!").build();
    }

    /* -----------------------------------------------------------
     * 🆔 SELLER UPGRADE & AI OCR IDENTITY (FULL RED SECTION RESTORED)
     * ----------------------------------------------------------- */
    @Transactional
    public String upgradeToSeller(String contactInfo, SellerRegistrationDTO dto, MultipartFile front, MultipartFile back, MultipartFile license) {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        
        if (user.getRoles() != null && user.getRoles().contains("SELLER")) return "Bạn đã là Người bán rồi!";

        String providedEmail = (dto.getEmail() != null) ? dto.getEmail().trim().toLowerCase() : null;
        if (providedEmail == null || providedEmail.isEmpty()) throw new RuntimeException("Email là bắt buộc!");

        Optional<User> existingEmailUser = userRepository.findByEmail(providedEmail);
        if (existingEmailUser.isPresent() && !existingEmailUser.get().getId().equals(user.getId())) throw new RuntimeException("Email đã được sử dụng!");
        
        if (!providedEmail.equals(user.getEmail())) user.setEmail(providedEmail);

        try {
            if (front != null && !front.isEmpty() && back != null && !back.isEmpty()) {
                if (Arrays.equals(front.getBytes(), back.getBytes())) throw new RuntimeException("Ảnh hai mặt trùng nhau.");

                AzureOCRService.IdAnalysisResult frontResult = ocrService.analyzeIdDocument(front);
                AzureOCRService.IdAnalysisResult backResult = ocrService.analyzeIdDocument(back);

                String sideF = frontResult.getSide();
                String sideB = backResult.getSide();

                if (!"unknown".equals(sideF) && sideF.equalsIgnoreCase(sideB)) throw new RuntimeException("Vui lòng cung cấp cả mặt trước và mặt sau.");
                if ("back".equals(sideF)) throw new RuntimeException("Ảnh mặt trước thực tế là mặt sau.");
                if ("front".equals(sideB)) throw new RuntimeException("Ảnh mặt sau thực tế là mặt trước.");

                if (frontResult.getIdNumber() != null && dto.getCccdNumber() != null) {
                    if (!dto.getCccdNumber().equals(frontResult.getIdNumber())) throw new RuntimeException("Số định danh không khớp with ảnh.");
                }
            }

            String frontUrl = (front != null) ? saveFile(front, user.getId(), "front") : null;
            String backUrl = (back != null) ? saveFile(back, user.getId(), "back") : null;
            String licenseUrl = (license != null) ? saveFile(license, user.getId(), "license") : null;

            user.setIdentityInfo(User.IdentityInfo.builder()
                .identityType(dto.getIdentityType()).cccdNumber(dto.getCccdNumber())
                .frontImageUrl(frontUrl).backImageUrl(backUrl).submittedAt(LocalDateTime.now()).build());

            User.ShopProfile profile = user.getShopProfile() != null ? user.getShopProfile() : new User.ShopProfile();
            profile.setShopName(dto.getShopName());
            profile.setShopSlug(generateUniqueSlug(dto.getShopName(), user.getId()));
            profile.setBusinessType(dto.getBusinessType());
            profile.setBusinessLicenseUrl(licenseUrl);
            user.setShopProfile(profile);

            // 🛡️ RE-IMPLEMENTED: Full Red Section Checks
            boolean basicInfoDone = profile != null && profile.getShopName() != null && !profile.getShopName().isBlank();
            boolean identityImagesDone = user.getIdentityInfo() != null && user.getIdentityInfo().getFrontImageUrl() != null;
            boolean cccdNumberDone = false;
            if (user.getIdentityInfo() != null && user.getIdentityInfo().getCccdNumber() != null) {
                String num = user.getIdentityInfo().getCccdNumber();
                cccdNumberDone = "PASSPORT".equals(dto.getIdentityType()) ? num.matches("^[A-Z]\\d{7,8}$") : num.length() == 12;
            }
            boolean licenseDone = "INDIVIDUAL".equals(profile.getBusinessType()) || profile.getBusinessLicenseUrl() != null;

            if (basicInfoDone && identityImagesDone && cccdNumberDone && licenseDone) {
                user.setSellerVerification("PENDING");
                user.setAccountStatus("PENDING_SELLER");
            } else {
                user.setSellerVerification("DRAFT");
            }

            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            if ("PENDING".equals(user.getSellerVerification())) {
                try {
                    azureService.sendSellerSubmissionReceivedEmail(user.getEmail(), user.getFullName());
                } catch (Exception emailEx) {
                    log.error("Email failed for {}: {}", user.getEmail(), emailEx.getMessage());
                }
            }

            return "PENDING".equals(user.getSellerVerification()) ? "Hồ sơ đã gửi thành công!" : "Đã lưu bản nháp!";
            
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi lưu hồ sơ: " + e.getMessage());
        }
    }

    /* -----------------------------------------------------------
     * 🚀 SMS OTP HANDLERS
     * ----------------------------------------------------------- */
    @Transactional
    public String sendPhoneOtp(String phoneNumber) {
        String normalized = normalizePhone(phoneNumber);
        if (!isValidPhone(normalized)) throw new RuntimeException("SĐT không hợp lệ.");

        String otpCode = String.format("%06d", new Random().nextInt(999999));
        phoneOtpRepository.deleteByPhoneNumber(normalized);
        phoneOtpRepository.save(new PhoneOtp(normalized, otpCode, otpExpirationMinutes));

        String e164Phone = formatToE164(phoneNumber);
        String message = "[AiNetSoft] Ma OTP cua ban la: " + otpCode;
        azureService.sendSms(e164Phone, message);
        return "Mã OTP đã được gửi!";
    }

    public boolean verifyPhoneOtp(String phoneNumber, String code) {
        String normalized = normalizePhone(phoneNumber);
        return phoneOtpRepository.findTopByPhoneNumberAndOtpCodeOrderByExpiryTimeDesc(normalized, code)
                .filter(otp -> otp.getExpiryTime().isAfter(LocalDateTime.now())).isPresent();
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.trim().length() < 8) throw new RuntimeException("Mật khẩu tối thiểu 8 ký tự.");
    }
}