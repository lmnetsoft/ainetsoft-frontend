package com.ainetsoft.service;

import com.ainetsoft.config.JwtUtils;
import com.ainetsoft.config.VietnamProvinceConfig;
import com.ainetsoft.dto.*;
import com.ainetsoft.model.User;
import com.ainetsoft.model.CartItem;
import com.ainetsoft.model.BankAccount;
import com.ainetsoft.model.PasswordResetToken;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.PasswordResetTokenRepository;
import com.ainetsoft.repository.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value; // 🚀 Added for @Value
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
    private final String UPLOAD_DIR = "uploads/cccd/";
    private final String LICENSE_DIR = "uploads/license/";

    /**
     * 🚀 NEW: Environment-aware Frontend URL.
     * This avoids hardcoding localhost and allows Azure overrides.
     */
    @Value("${app.frontend.url}")
    private String frontendUrl;

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
        String targetDir = type.equals("license") ? LICENSE_DIR : UPLOAD_DIR;
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

        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getShopProfile() != null) user.setShopProfile(request.getShopProfile());
        if (request.getAddresses() != null) user.setAddresses(request.getAddresses());

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return "Cập nhật hồ sơ thành công!";
    }

    /**
     * 🛡️ UPDATED: Secure registration with Dynamic Verification Link.
     * Uses injected frontendUrl instead of hardcoded localhost.
     */
    @Transactional
    public String register(RegisterRequest request) {
        validatePasswordStrength(request.getPassword());
        String email = (request.getEmail() == null || request.getEmail().isBlank()) ? null : request.getEmail().trim().toLowerCase();
        String phone = normalizePhone(request.getPhone());
        
        if (email != null && userRepository.existsByEmail(email)) throw new RuntimeException("Email đã tồn tại!");
        if (phone != null && userRepository.existsByPhone(phone)) throw new RuntimeException("SĐT đã tồn tại!");

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
            // 🚀 FIXED: Dynamic link construction
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
                    throw new RuntimeException("Ảnh tải lên ô 'Mặt sau' thực tế là mặt trước. Vui lòng tải lên đúng mặt thẻ.");
                }

                if (frontResult.getIdNumber() != null && dto.getCccdNumber() != null) {
                    String normalizedInput = dto.getCccdNumber().toUpperCase().replaceAll("[^A-Z0-9]", "");
                    String normalizedExtracted = frontResult.getIdNumber();

                    if (!normalizedInput.equals(normalizedExtracted)) {
                        log.warn("AI MISMATCH: Typed [{}] vs Extracted [{}]", normalizedInput, normalizedExtracted);
                        throw new RuntimeException("Số định danh trên ảnh không khớp với thông tin bạn nhập. Vui lòng kiểm tra lại.");
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
                    if (p1 != null && p1.equals(p2)) throw new RuntimeException("SĐT các kho phải khác nhau.");
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
    public User updateShopSettings(String contactInfo, ShopSettingsUpdateRequest request, MultipartFile newLicense) throws IOException {
        String identifier = normalizeIdentifier(contactInfo);
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        User.ShopProfile currentProfile = user.getShopProfile();
        if (currentProfile == null) throw new RuntimeException("Tài khoản chưa có thông tin Shop.");

        boolean divertToPending = "VERIFIED".equalsIgnoreCase(user.getSellerVerification());
        
        User.ShopProfile targetProfile;
        if (divertToPending) {
            targetProfile = User.ShopProfile.builder()
                .shopName(currentProfile.getShopName())
                .shopSlug(currentProfile.getShopSlug())
                .shopDescription(currentProfile.getShopDescription())
                .shopAddress(currentProfile.getShopAddress())
                .shopLogoUrl(currentProfile.getShopLogoUrl())
                .businessEmail(currentProfile.getBusinessEmail())
                .businessPhone(currentProfile.getBusinessPhone())
                .businessType(currentProfile.getBusinessType())
                .companyName(currentProfile.getCompanyName())
                .registeredAddress(currentProfile.getRegisteredAddress())
                .invoiceEmails(currentProfile.getInvoiceEmails() != null ? new ArrayList<>(currentProfile.getInvoiceEmails()) : new ArrayList<>())
                .taxCode(currentProfile.getTaxCode())
                .businessLicenseUrl(currentProfile.getBusinessLicenseUrl())
                .enabledShippingMethodIds(currentProfile.getEnabledShippingMethodIds() != null ? new ArrayList<>(currentProfile.getEnabledShippingMethodIds()) : new ArrayList<>())
                .lowStockThreshold(currentProfile.getLowStockThreshold())
                .holidayMode(currentProfile.isHolidayMode())
                .lastShopNameChange(currentProfile.getLastShopNameChange())
                .build();
        } else {
            targetProfile = currentProfile;
        }

        if (request.getShopName() != null && !request.getShopName().equals(currentProfile.getShopName())) {
            LocalDateTime lastChange = currentProfile.getLastShopNameChange();
            if (lastChange != null && lastChange.plusMonths(1).isAfter(LocalDateTime.now())) {
                long days = ChronoUnit.DAYS.between(LocalDateTime.now(), lastChange.plusMonths(1));
                throw new RuntimeException("Đổi tên Shop tối đa 1 lần/tháng. Vui lòng chờ: " + days + " ngày.");
            }
            targetProfile.setShopName(request.getShopName());
            targetProfile.setShopSlug(generateUniqueSlug(request.getShopName(), user.getId()));
            targetProfile.setLastShopNameChange(LocalDateTime.now());
        }

        if (request.getTaxCode() != null) targetProfile.setTaxCode(request.getTaxCode());
        if (newLicense != null && !newLicense.isEmpty()) {
            targetProfile.setBusinessLicenseUrl(saveFile(newLicense, user.getId(), "license"));
        }

        if (request.getShopBio() != null) targetProfile.setShopDescription(request.getShopBio());
        if (request.getInvoiceEmails() != null) targetProfile.setInvoiceEmails(request.getInvoiceEmails());
        targetProfile.setLowStockThreshold(request.getLowStockThreshold());
        targetProfile.setHolidayMode(request.isHolidayMode());

        List<User.AddressInfo> targetAddrs = new ArrayList<>();
        if (request.getStockAddresses() != null) {
            Set<String> phones = new HashSet<>();
            for (AddressDTO aDto : request.getStockAddresses()) {
                String p = normalizePhone(aDto.getPhoneNumber());
                if (!phones.add(p)) throw new RuntimeException("SĐT các kho phải khác nhau.");
                
                targetAddrs.add(User.AddressInfo.builder()
                        .receiverName(aDto.getFullName()).phone(p)
                        .province(null)
                        .ward(null)
                        .hamlet(null)
                        .detail(aDto.getDetailAddress())
                        .latitude(aDto.getLatitude()).longitude(aDto.getLongitude()).isDefault(aDto.isDefault())
                        .build());
            }
        } else {
            targetAddrs = user.getAddresses();
        }

        if (divertToPending) {
            user.setPendingShopProfile(targetProfile);
            user.setPendingAddresses(targetAddrs);
            user.setHasPendingUpdate(true);
            notificationService.createNotification("ADMIN", "Yêu cầu cập nhật Shop", 
                "Cửa hàng [" + currentProfile.getShopName() + "] yêu cầu thay đổi thông tin.", 
                "SHOP_UPDATE_REQUEST", user.getId());
        } else {
            user.setShopProfile(targetProfile);
            user.setAddresses(targetAddrs);
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

        azureService.sendResetEmail(identifier, otp);
        return "Mã OTP đã được gửi đến email của bạn.";
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
                .orElseThrow(() -> new RuntimeException("Cửa hàng với link '" + slug + "' không tồn tại!"));

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
                .emailVerified(user.isEmailVerified())
                .build();
    }    
}