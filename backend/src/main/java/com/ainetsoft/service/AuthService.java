package com.ainetsoft.service;

import com.ainetsoft.config.JwtUtils;
import com.ainetsoft.config.VietnamProvinceConfig;
import com.ainetsoft.dto.*;
import com.ainetsoft.model.User;
import com.ainetsoft.model.CartItem;
import com.ainetsoft.model.BankAccount;
import com.ainetsoft.model.OtpToken; 
import com.ainetsoft.model.PasswordResetToken;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.PasswordResetTokenRepository;
import com.ainetsoft.repository.BankAccountRepository;
import com.ainetsoft.repository.OtpTokenRepository; 
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
    private final AzureCommunicationService azureService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final AzureOCRService ocrService;
    private final BankAccountRepository bankAccountRepository;
    private final EncryptionService encryptionService;
    
    // 🚀 NEW DEPENDENCIES (Appended to support OTP flow)
    private final InfobipService infobipService; 
    private final OtpTokenRepository otpTokenRepository;
    
    private final String UPLOAD_DIR = "uploads/cccd/";
    private final String LICENSE_DIR = "uploads/license/";
    private final String LOGO_DIR = "uploads/logo/"; 

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public AzureOCRService.IdAnalysisResult verifyOCR(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new RuntimeException("Vui lòng cung cấp ảnh định danh.");
        }
        return ocrService.analyzeIdDocument(image);
    }

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

        String newPhone = normalizePhone(request.getPhone());
        if (newPhone == null || newPhone.isBlank()) {
            throw new RuntimeException("Số điện thoại là bắt buộc để cập nhật hồ sơ!");
        }

        boolean isSocialUser = user.getProvider() != null && 
                               !user.getProvider().toString().equalsIgnoreCase("LOCAL");
        boolean registeredByEmail = (user.getEmail() != null && user.getPhone() == null);
        boolean emailMandatory = isSocialUser || registeredByEmail;

        String newEmail = (request.getEmail() != null) ? request.getEmail().trim().toLowerCase() : null;

        if (emailMandatory && (newEmail == null || newEmail.isBlank())) {
            throw new RuntimeException("Email là thông tin bắt buộc đối với phương thức đăng nhập của bạn!");
        }

        // 🚀 NEW SECURITY RULE: Detect if BOTH are trying to change
        boolean phoneChanged = !newPhone.equals(user.getPhone());
        boolean emailChanged = newEmail != null && user.getEmail() != null && !newEmail.equals(user.getEmail());

        if (phoneChanged && emailChanged) {
            throw new RuntimeException("Vì lý do bảo mật, bạn chỉ có thể thay đổi Email HOẶC Số điện thoại cùng một lúc. Vui lòng thực hiện từng bước.");
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        // Handle Email Validation (Only runs if emailChanged is true and phoneChanged is false)
        if (emailChanged) {
            if (userRepository.existsByEmail(newEmail)) {
                throw new RuntimeException("Email '" + newEmail + "' đã được sử dụng bởi tài khoản khác!");
            }
            log.info("Validated email availability for {}. Awaiting separate confirmation logic.", newEmail);
            // Note: If you are setting the email here immediately without OTP, uncomment the line below. 
            // If you rely on the confirmEmailChange endpoint to do it later, leave it handled there.
            // user.setEmail(newEmail);
        }

        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getBirthDate() != null) user.setBirthDate(request.getBirthDate());
        
        // Handle Phone Update (Only runs if phoneChanged is true and emailChanged is false)
        if (phoneChanged) {
            if (userRepository.existsByPhone(newPhone)) {
                throw new RuntimeException("Số điện thoại này đã được sử dụng bởi tài khoản khác!");
            }

            if (request.getOtpCode() == null || request.getOtpCode().isBlank()) {
                throw new RuntimeException("Vui lòng cung cấp mã xác nhận để thay đổi số điện thoại!");
            }

            if (!verifyOtp(newPhone, request.getOtpCode())) {
                throw new RuntimeException("Mã xác nhận không chính xác hoặc đã hết hạn!");
            }

            user.setPhone(newPhone);
            otpTokenRepository.deleteByPhoneNumber(newPhone);
            log.info("User {} successfully changed phone number to {}", user.getId(), newPhone);
        }

        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getShopProfile() != null) user.setShopProfile(request.getShopProfile());
        if (request.getAddresses() != null) user.setAddresses(request.getAddresses());

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return "Cập nhật hồ sơ thành công!";
    }

    @Transactional
    public String register(RegisterRequest request) {
        validatePasswordStrength(request.getPassword());
        String email = (request.getEmail() == null || request.getEmail().isBlank()) ? null : request.getEmail().trim().toLowerCase();
        String phone = normalizePhone(request.getPhone());
        
        if (email != null && userRepository.existsByEmail(email)) throw new RuntimeException("Email đã tồn tại!");
        if (phone != null && userRepository.existsByPhone(phone)) throw new RuntimeException("SĐT đã tồn tại!");

        // 🚀 THE GATEKEEPER: Ensure OTP is verified for phone registrations
        if (phone != null) {
            if (request.getOtpCode() == null || request.getOtpCode().isBlank()) {
                throw new RuntimeException("Mã xác nhận là bắt buộc để đăng ký bằng số điện thoại!");
            }
            if (!verifyOtp(phone, request.getOtpCode())) {
                throw new RuntimeException("Mã xác nhận không chính xác hoặc đã hết hạn!");
            }
            otpTokenRepository.deleteByPhoneNumber(phone); // Burn token after success
        }

        String verificationToken = (email != null) ? UUID.randomUUID().toString() : null;

        User user = User.builder()
                .email(email)
                .phone(phone)
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Collections.singleton("USER")))
                .provider(User.AuthProvider.LOCAL)
                .enabled(email == null) 
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
                return "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.";
            } catch (Exception e) {
                log.error("Failed to send verification email: {}", e.getMessage());
                return "Đăng ký thành công! Tuy nhiên, có lỗi khi gửi email xác thực. Vui lòng liên hệ hỗ trợ.";
            }
        }

        return "Đăng ký thành công!";
    }

    // --- OTP LOGIC (NEW METHODS) ---
    @Transactional
    public void generateAndSendOtp(String phone) {
        String normalizedPhone = normalizePhone(phone);
        // Generate code
        String code = String.format("%06d", new Random().nextInt(999999));
        
        // 🛡️ Log the generated code so you can see it in your terminal
        log.info("🚀 GENERATED OTP: [{}] for phone: {}", code, normalizedPhone);
        
        otpTokenRepository.deleteByPhoneNumber(normalizedPhone);
        
        OtpToken token = new OtpToken();
        token.setPhoneNumber(normalizedPhone);
        token.setCode(code);
        // Set 5 minutes from now
        token.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        token.setExpireAt(LocalDateTime.now().plusMinutes(5)); 
        otpTokenRepository.save(token);

        String internationalPhone = normalizedPhone.startsWith("0") ? "84" + normalizedPhone.substring(1) : normalizedPhone;
        infobipService.sendSms(internationalPhone, "Ma xac minh AiNetsoft cua ban la: " + code);
    }

    public boolean verifyOtp(String phone, String code) {
        String normalizedPhone = normalizePhone(phone);
        
        // 🛡️ Added robust logging for troubleshooting
        Optional<OtpToken> tokenOpt = otpTokenRepository.findTopByPhoneNumberOrderByExpiryDateDesc(normalizedPhone);
        
        if (tokenOpt.isEmpty()) {
            log.warn("❌ OTP Verification Failed: No token found in DB for {}", normalizedPhone);
            return false;
        }

        OtpToken token = tokenOpt.get();
        // 🛡️ Use .trim() to ensure no spaces cause a mismatch
        boolean matches = token.getCode().trim().equals(code.trim());
        
        log.info("🔍 OTP Verification for {}: Input=[{}] vs Saved=[{}] -> Match={}", 
                 normalizedPhone, code, token.getCode(), matches);
                 
        return matches;
    }

    @Transactional
    public String confirmEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Liên kết xác thực không hợp lệ hoặc đã hết hạn."));

        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setVerificationToken(null); 
        userRepository.save(user);

        return "Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập ngay bây giờ.";
    }

    public LoginResponse login(LoginRequest request) {
        String identifier = normalizeIdentifier(request.getContactInfo());
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        if (!user.isEnabled()) {
            throw new RuntimeException("Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email để xác thực.");
        }
        if ("BANNED".equalsIgnoreCase(user.getAccountStatus())) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa bởi Quản trị viên.");
        }
        
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
    public String upgradeToSeller(String contactInfo, SellerRegistrationDTO dto, MultipartFile front, MultipartFile back, MultipartFile license) {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        
        if (user.getRoles() != null && user.getRoles().contains("SELLER")) {
            return "Bạn đã là Người bán rồi!";
        }

        String providedEmail = (dto.getEmail() != null) ? dto.getEmail().trim().toLowerCase() : null;
        if (providedEmail == null || providedEmail.isEmpty()) {
            throw new RuntimeException("Email là bắt buộc để đăng ký làm Người bán!");
        }

        Optional<User> existingEmailUser = userRepository.findByEmail(providedEmail);
        if (existingEmailUser.isPresent() && !existingEmailUser.get().getId().equals(user.getId())) {
            throw new RuntimeException("Email '" + providedEmail + "' đã được sử dụng bởi một tài khoản khác!");
        }
        
        if (!providedEmail.equals(user.getEmail())) {
            user.setEmail(providedEmail);
        }

        try {
            if (front != null && !front.isEmpty() && back != null && !back.isEmpty()) {
                if (Arrays.equals(front.getBytes(), back.getBytes())) {
                    throw new RuntimeException("Ảnh mặt trước và mặt sau là cùng một tệp tin. Vui lòng tải lên đúng 2 mặt khác nhau.");
                }

                log.info("AI Analysis started for user: {}", user.getId());
                AzureOCRService.IdAnalysisResult frontResult = ocrService.analyzeIdDocument(front);
                AzureOCRService.IdAnalysisResult backResult = ocrService.analyzeIdDocument(back);

                String sideF = frontResult.getSide();
                String sideB = backResult.getSide();

                if (!"unknown".equals(sideF) && !"unknown".equals(sideB) && sideF.equalsIgnoreCase(sideB)) {
                    throw new RuntimeException("Bạn đã tải lên cùng một mặt của thẻ. Vui lòng cung cấp cả mặt trước và mặt sau.");
                }

                if ("back".equals(sideF)) {
                    throw new RuntimeException("Ảnh tải lên ô 'Mặt trước' thực tế là mặt sau. Vui lòng tải lên đúng mặt thẻ.");
                }
                if ("front".equals(sideB)) {
                    throw new RuntimeException("Ảnh tải lên ô 'Mật sau' thực tế là mặt trước. Vui lòng tải lên đúng mặt thẻ.");
                }

                if (frontResult.getIdNumber() != null && dto.getCccdNumber() != null) {
                    String normalizedInput = dto.getCccdNumber().toUpperCase().replaceAll("[^A-Z0-9]", "");
                    String normalizedExtracted = frontResult.getIdNumber();

                    if (!normalizedInput.equals(normalizedExtracted)) {
                        log.warn("AI MISMATCH: Typed [{}] vs Extracted [{}]", normalizedInput, normalizedExtracted);
                        throw new RuntimeException("Số định danh trên ảnh không khớp with thông tin bạn nhập. Vui lòng kiểm tra lại.");
                    }
                }
            }

            String frontUrl = (front != null && !front.isEmpty()) ? saveFile(front, user.getId(), "front") : 
                             (user.getIdentityInfo() != null ? user.getIdentityInfo().getFrontImageUrl() : null);
            String backUrl = (back != null && !back.isEmpty()) ? saveFile(back, user.getId(), "back") : 
                            (user.getIdentityInfo() != null ? user.getIdentityInfo().getBackImageUrl() : null);
            String licenseUrl = (license != null && !license.isEmpty()) ? saveFile(license, user.getId(), "license") :
                               (user.getShopProfile() != null ? user.getShopProfile().getBusinessLicenseUrl() : null);

            user.setIdentityInfo(User.IdentityInfo.builder()
                .identityType(dto.getIdentityType()) 
                .cccdNumber(dto.getCccdNumber())
                .frontImageUrl(frontUrl)
                .backImageUrl(backUrl)
                .submittedAt(LocalDateTime.now())
                .build());

            List<User.AddressInfo> addressInfos = new ArrayList<>();
            if (dto.getStockAddresses() != null && !dto.getStockAddresses().isEmpty()) {
                if (dto.getStockAddresses().size() > 2) throw new RuntimeException("Tối đa 2 địa chỉ.");
                
                if (dto.getStockAddresses().size() == 2) {
                    String p1 = normalizePhone(dto.getStockAddresses().get(0).getPhoneNumber());
                    String p2 = normalizePhone(dto.getStockAddresses().get(1).getPhoneNumber());
                    if (p1 != null && p1.equals(p2)) throw new RuntimeException("Số định danh các kho hàng phải khác nhau.");
                }

                for (AddressDTO addrDto : dto.getStockAddresses()) {
                    if (!isValidPhone(addrDto.getPhoneNumber())) throw new RuntimeException("SĐT không hợp lệ.");
                    if (addrDto.getProvince() != null && !VietnamProvinceConfig.isValid(addrDto.getProvince())) throw new RuntimeException("Tỉnh không hợp lệ.");
                    
                    addressInfos.add(User.AddressInfo.builder()
                            .receiverName(addrDto.getFullName())
                            .phone(normalizePhone(addrDto.getPhoneNumber()))
                            .province(null)
                            .ward(null)
                            .hamlet(null)
                            .detail(addrDto.getDetailAddress())
                            .latitude(addrDto.getLatitude())
                            .longitude(addrDto.getLongitude())
                            .isDefault(addrDto.isDefault())
                            .build());
                }
                user.setAddresses(addressInfos);
            }

            List<String> enabledShippingIds = new ArrayList<>();
            if (dto.getShippingMethods() != null) {
                dto.getShippingMethods().forEach((methodId, isEnabled) -> {
                    if (Boolean.TRUE.equals(isEnabled)) enabledShippingIds.add(methodId);
                });
            }

            User.ShopProfile currentShop = user.getShopProfile() != null ? user.getShopProfile() : new User.ShopProfile();
            user.setShopProfile(User.ShopProfile.builder()
                    .shopName(dto.getShopName() != null ? dto.getShopName() : currentShop.getShopName())
                    .shopSlug(generateUniqueSlug(dto.getShopName(), user.getId()))
                    .lastShopNameChange(LocalDateTime.now())
                    .shopAddress(!addressInfos.isEmpty() ? addressInfos.get(0).getDetail() : 
                                (currentShop.getShopAddress() != null ? currentShop.getShopAddress() : "Chưa cập nhật"))
                    .taxCode(dto.getTaxCode() != null ? dto.getTaxCode() : currentShop.getTaxCode()) 
                    .businessEmail(providedEmail)
                    .businessPhone(user.getPhone())
                    .businessType(dto.getBusinessType() != null ? dto.getBusinessType() : currentShop.getBusinessType())
                    .companyName(dto.getCompanyName() != null ? dto.getCompanyName() : currentShop.getCompanyName())
                    .registeredAddress(dto.getRegisteredAddress() != null ? dto.getRegisteredAddress() : currentShop.getRegisteredAddress())
                    .invoiceEmails(dto.getInvoiceEmails() != null ? dto.getInvoiceEmails() : currentShop.getInvoiceEmails())
                    .businessLicenseUrl(licenseUrl)
                    .enabledShippingMethodIds(dto.getShippingMethods() != null ? enabledShippingIds : currentShop.getEnabledShippingMethodIds())
                    .build());

            User.ShopProfile profile = user.getShopProfile();
            User.IdentityInfo identity = user.getIdentityInfo();
            boolean basicInfoDone = profile != null && profile.getShopName() != null && !profile.getShopName().isBlank();
            boolean identityImagesDone = identity != null && identity.getFrontImageUrl() != null && identity.getBackImageUrl() != null;
            boolean cccdNumberDone = false;
            if (identity != null && identity.getCccdNumber() != null) {
                String num = identity.getCccdNumber();
                if ("PASSPORT".equals(dto.getIdentityType())) {
                    cccdNumberDone = num.matches("^[A-Z]\\d{7,8}$");
                } else {
                    cccdNumberDone = num.length() == 12;
                }
            }            
            boolean licenseDone = true;
            if (profile != null && !"INDIVIDUAL".equals(profile.getBusinessType())) {
                licenseDone = profile.getBusinessLicenseUrl() != null;
            }

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
                    log.error("Initial Seller Email failed for {}: {}", user.getEmail(), emailEx.getMessage());
                }
            }

            return "PENDING".equals(user.getSellerVerification()) ? "Hồ sơ đã gửi thành công!" : "Đã lưu tiến trình!";
            
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception e) {
            log.error("Upgrade error: {}", e.getMessage());
            throw new RuntimeException("Lỗi khi lưu hồ sơ: " + e.getMessage());
        }
    }

    @Transactional
    public User updateShopSettings(String contactInfo, ShopSettingsUpdateRequest request, MultipartFile newLicense, MultipartFile newLogo) throws IOException {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        User.ShopProfile currentProfile = user.getShopProfile();
        if (currentProfile == null) throw new RuntimeException("Tài khoản chưa có thông tin Shop.");

        if (newLogo != null && !newLogo.isEmpty()) {
            currentProfile.setShopLogoUrl(saveFile(newLogo, user.getId(), "logo"));
        }
        if (request.getShopBio() != null) currentProfile.setShopDescription(request.getShopBio());
        
        if (request.getInvoiceEmails() != null) currentProfile.setInvoiceEmails(new ArrayList<>(request.getInvoiceEmails()));
        currentProfile.setLowStockThreshold(request.getLowStockThreshold());
        currentProfile.setHolidayMode(request.isHolidayMode());

        boolean nameChanged = request.getShopName() != null && !request.getShopName().trim().equals(currentProfile.getShopName());
        boolean typeChanged = request.getBusinessType() != null && !request.getBusinessType().equals(currentProfile.getBusinessType());
        boolean taxChanged = request.getTaxCode() != null && !request.getTaxCode().trim().equals(currentProfile.getTaxCode());
        boolean licenseChanged = newLicense != null && !newLicense.isEmpty(); 
        
        boolean addressChanged = false;
        if (request.getStockAddresses() != null) {
            if (user.getAddresses().size() != request.getStockAddresses().size()) {
                addressChanged = true;
            } else {
                for (int i = 0; i < user.getAddresses().size(); i++) {
                    AddressDTO dto = request.getStockAddresses().get(i);
                    User.AddressInfo live = user.getAddresses().get(i);
                    if (!dto.getFullName().equals(live.getReceiverName()) || 
                        !normalizePhone(dto.getPhoneNumber()).equals(normalizePhone(live.getPhone())) ||
                        !dto.getDetailAddress().trim().equals(live.getDetail().trim())) {
                        addressChanged = true;
                        break;
                    }
                }
            }
        }

        boolean isAlreadyVerified = "VERIFIED".equalsIgnoreCase(user.getSellerVerification());

        if (isAlreadyVerified && (nameChanged || typeChanged || taxChanged || licenseChanged || addressChanged)) {
            if (nameChanged && currentProfile.getLastShopNameChange() != null) {
                LocalDateTime lastChange = currentProfile.getLastShopNameChange();
                if (lastChange.plusMonths(1).isAfter(LocalDateTime.now())) {
                    long days = ChronoUnit.DAYS.between(LocalDateTime.now(), lastChange.plusMonths(1));
                    throw new RuntimeException("Theo quy định, bạn chỉ có thể đổi tên Shop 30 ngày một lần. Vui lòng chờ: " + days + " ngày.");
                }
            }

            String finalLicenseUrl = currentProfile.getBusinessLicenseUrl();
            if ("INDIVIDUAL".equals(request.getBusinessType())) {
                finalLicenseUrl = null;
            } else if (licenseChanged) {
                finalLicenseUrl = saveFile(newLicense, user.getId(), "license");
            }

            User.ShopProfile pendingSnapshot = User.ShopProfile.builder()
                .shopName(nameChanged ? request.getShopName() : currentProfile.getShopName())
                .shopSlug(nameChanged ? generateUniqueSlug(request.getShopName(), user.getId()) : currentProfile.getShopSlug())
                .businessType(typeChanged ? request.getBusinessType() : currentProfile.getBusinessType())
                .taxCode(taxChanged ? request.getTaxCode() : currentProfile.getTaxCode())
                .businessLicenseUrl(finalLicenseUrl) 
                .shopLogoUrl(currentProfile.getShopLogoUrl())
                .shopDescription(currentProfile.getShopDescription())
                .businessEmail(currentProfile.getBusinessEmail())
                .businessPhone(currentProfile.getBusinessPhone())
                .companyName(currentProfile.getCompanyName())
                .registeredAddress(currentProfile.getRegisteredAddress())
                .invoiceEmails(new ArrayList<>(currentProfile.getInvoiceEmails()))
                .enabledShippingMethodIds(new ArrayList<>(currentProfile.getEnabledShippingMethodIds()))
                .lowStockThreshold(currentProfile.getLowStockThreshold())
                .holidayMode(currentProfile.isHolidayMode())
                .lastShopNameChange(nameChanged ? LocalDateTime.now() : currentProfile.getLastShopNameChange())
                .build();

            user.setPendingShopProfile(pendingSnapshot);

            if (addressChanged) {
                List<User.AddressInfo> pendingAddrs = new ArrayList<>();
                Set<String> phones = new HashSet<>(); 
                for (AddressDTO aDto : request.getStockAddresses()) {
                    String p = normalizePhone(aDto.getPhoneNumber());
                    if (p != null && !phones.add(p)) throw new RuntimeException("Số điện thoại các kho hàng phải khác nhau.");
                    pendingAddrs.add(User.AddressInfo.builder()
                            .receiverName(aDto.getFullName()).phone(p)
                            .detail(aDto.getDetailAddress())
                            .latitude(aDto.getLatitude()).longitude(aDto.getLongitude()).isDefault(aDto.isDefault())
                            .build());
                }
                user.setPendingAddresses(pendingAddrs);
            }

            user.setHasPendingUpdate(true);
            notificationService.createNotification("ADMIN", "Yêu cầu cập nhật Shop", 
                "Cửa hàng [" + currentProfile.getShopName() + "] yêu cầu thay đổi thông tin pháp lý.", 
                "SHOP_UPDATE_REQUEST", user.getId());
        } else if (!isAlreadyVerified) {
            if (nameChanged) {
                currentProfile.setShopName(request.getShopName());
                currentProfile.setShopSlug(generateUniqueSlug(request.getShopName(), user.getId()));
                currentProfile.setLastShopNameChange(LocalDateTime.now());
            }
            if (typeChanged) currentProfile.setBusinessType(request.getBusinessType());
            if (taxChanged) currentProfile.setTaxCode(request.getTaxCode());

            if ("INDIVIDUAL".equals(request.getBusinessType())) {
                currentProfile.setBusinessLicenseUrl(null);
            } else if (licenseChanged) {
                currentProfile.setBusinessLicenseUrl(saveFile(newLicense, user.getId(), "license"));
            }
            
            if (addressChanged) {
                List<User.AddressInfo> liveAddrs = new ArrayList<>();
                Set<String> phones = new HashSet<>();
                for (AddressDTO aDto : request.getStockAddresses()) {
                    String p = normalizePhone(aDto.getPhoneNumber());
                    if (p != null && !phones.add(p)) throw new RuntimeException("Số điện thoại các kho hàng phải khác nhau.");
                    liveAddrs.add(User.AddressInfo.builder()
                            .receiverName(aDto.getFullName()).phone(p)
                            .detail(aDto.getDetailAddress())
                            .latitude(aDto.getLatitude()).longitude(aDto.getLongitude()).isDefault(aDto.isDefault())
                            .build());
                }
                user.setAddresses(liveAddrs);
            }
        }

        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public String updateBankAccount(String contactInfo, BankAccountDTO request) {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (user.isHasPendingUpdate()) {
            throw new RuntimeException("Bạn đang có một yêu cầu thay đổi thông tin chờ phê duyệt. Vui lòng đợi Admin xử lý.");
        }

        boolean isVerifiedSeller = "VERIFIED".equalsIgnoreCase(user.getSellerVerification());

        if (isVerifiedSeller) {
            user.setPendingBankAccount(User.PendingBank.builder()
                    .bankName(request.getBankName())
                    .accountHolder(request.getAccountHolder())
                    .accountNumber(request.getAccountNumber())
                    .build());
            user.setHasPendingUpdate(true); 
            
            notificationService.createNotification("ADMIN", "Yêu cầu thay đổi tài khoản ngân hàng", 
                "Cửa hàng [" + (user.getShopProfile() != null ? user.getShopProfile().getShopName() : user.getFullName()) + "] yêu cầu đổi thông tin ngân hàng.", 
                "BANK_UPDATE_REQUEST", user.getId());
                
            userRepository.save(user);
            return "Yêu cầu thay đổi ngân hàng đã được gửi và đang chờ Admin phê duyệt.";
        } else {
            List<BankAccount> existing = bankAccountRepository.findByUserId(user.getId());
            BankAccount account = existing.isEmpty() ? new BankAccount() : existing.get(0);
            
            account.setUserId(user.getId());
            account.setBankName(request.getBankName());
            account.setAccountHolder(request.getAccountHolder());
            account.setAccountNumber(encryptionService.encrypt(request.getAccountNumber()));
            account.setUpdatedAt(LocalDateTime.now());
            
            bankAccountRepository.save(account);
            return "Cập nhật tài khoản ngân hàng thành công!";
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
        
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Tài khoản '" + contactInfo + "' không tồn tại!"));
        
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        tokenRepository.deleteByContactInfo(identifier);
        PasswordResetToken token = PasswordResetToken.builder()
            .contactInfo(identifier)
            .otpCode(otp)
            .expiryDate(LocalDateTime.now().plusMinutes(10))
            .build();
        tokenRepository.save(token);

        if (identifier.contains("@")) {
            azureService.sendResetEmail(identifier, otp);
            return "Mã OTP đã được gửi đến email của bạn.";
        } else {
            String internationalPhone = identifier.startsWith("0") 
                ? "84" + identifier.substring(1) 
                : identifier;
                
            String message = "Ma xac minh AiNetsoft de khoi phuc mat khau cua ban la: " + otp;
            infobipService.sendSms(internationalPhone, message);
            
            log.info("🚀 Reset OTP [{}] sent via SMS to {}", otp, internationalPhone);
            return "Mã OTP đã được gửi đến số điện thoại của bạn.";
        }
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
        return Map.of("productId", productId, "isLiked", isNowLiked, "totalFavorites", favorites.size());
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
            throw new RuntimeException("Mật khẩu phải có nhất 8 ký tự!");
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

    public UserResponse getUserProfileBySlug(String slug) {
        User user = userRepository.findByShopProfile_ShopSlug(slug)
                .orElseThrow(() -> new RuntimeException("Cửa hàng with link '" + slug + "' không tồn tại!"));

        return UserResponse.builder()
                .id(user.getId()) 
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles())
                .shopProfile(user.getShopProfile()) 
                .identityInfo(user.getIdentityInfo()) 
                .addresses(user.getAddresses())
                .sellerVerification(user.getSellerVerification())
                .rejectionReason(user.getRejectionReason()) 
                .emailVerified(user.isEmailVerified())
                .build();
    }    
@Transactional
    public String initiateEmailChange(String currentContact, String newEmail) {
        String identifier = normalizeIdentifier(currentContact);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        String normalizedNewEmail = newEmail.trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedNewEmail)) {
            throw new RuntimeException("Email '" + normalizedNewEmail + "' đã được sử dụng!");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        
        tokenRepository.deleteByContactInfo(normalizedNewEmail);
        PasswordResetToken token = PasswordResetToken.builder()
                .contactInfo(normalizedNewEmail)
                .otpCode(otp)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .build();
        tokenRepository.save(token);

        try {
            // 🚀 CHANGED THIS LINE: Now uses the dedicated Email Change template
            azureService.sendEmailChangeVerification(normalizedNewEmail, otp); 
            log.info("Email verification OTP sent to new address: {}", normalizedNewEmail);
        } catch (Exception e) {
            throw new RuntimeException("Không thể gửi email xác thực. Vui lòng thử lại sau.");
        }

        return "Mã xác thực đã được gửi đến " + normalizedNewEmail;
    }
    
    @Transactional
    public String confirmEmailChange(String currentContact, String newEmail, String otp) {
        String identifier = normalizeIdentifier(currentContact);
        String normalizedNewEmail = newEmail.trim().toLowerCase();

        PasswordResetToken token = tokenRepository.findByContactInfoAndOtpCode(normalizedNewEmail, otp)
                .orElseThrow(() -> new RuntimeException("Mã xác thực không chính xác hoặc đã hết hạn!"));

        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("Lỗi hệ thống!"));
        
        user.setEmail(normalizedNewEmail);
        user.setEmailVerified(true); 
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        tokenRepository.delete(token);

        return "Cập nhật Email thành công!";
    }
}