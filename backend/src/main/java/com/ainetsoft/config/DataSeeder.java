package com.ainetsoft.config;

import com.ainetsoft.model.*;
import com.ainetsoft.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ShippingMethodRepository shippingMethodRepository;
    private final ReviewRepository reviewRepository;
    private final ReportReasonRepository reportReasonRepository;
    private final ProductReportRepository productReportRepository;
    private final PasswordEncoder passwordEncoder;
    
    // 🚀 NEW: Integrated for Quick Response Templates
    private final FeedbackTemplateRepository feedbackTemplateRepository;

    @Value("${app.seed.mock-data:true}")
    private boolean seedMockData;

    @Value("${app.seed.force-clean:false}")
    private boolean forceClean;

    @Value("${admin.setup.email:admin@ainetsoft.com}")
    private String adminEmail;

    @Value("${admin.setup.password:Test1234!}")
    private String adminPassword;

    @Value("${admin.setup.fullname:System Admin}")
    private String adminFullName;

    @Override
    public void run(String... args) throws Exception {
        log.info("--- 🚀 Data Seeder: Initializing Core (2026 Ready & Full Restore) ---");
        
        if (forceClean) {
            cleanupDatabase();
        }

        seedGlobalAdmin();
        List<ShippingMethod> globalMethods = seedShippingMethods();
        seedReportReasons();
        
        // 🚀 NEW: Seed Vietnamese Templates
        seedFeedbackTemplates();

        if (seedMockData) {
            log.info("🛠 Seeding Full Mock Ecosystem for Professional Testing...");
            List<Category> savedCats = seedCategories();
            seedDefaultSeller(savedCats, globalMethods);
            seedPendingModeration(savedCats, globalMethods);
            seedSubAdmin();
        }
    }

    private void cleanupDatabase() {
        log.warn("⚠️ FORCE CLEAN ENABLED: Wiping collections for fresh mock test...");
        productRepository.deleteAll();
        reviewRepository.deleteAll();
        categoryRepository.deleteAll();
        reportReasonRepository.deleteAll();
        productReportRepository.deleteAll();
        userRepository.deleteAll(); 
        shippingMethodRepository.deleteAll(); 
        
        // 🚀 NEW: Cleanup templates
        feedbackTemplateRepository.deleteAll();
        
        log.info("✅ Database cleaned successfully.");
    }

    private void seedGlobalAdmin() {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .email(adminEmail)
                    .fullName(adminFullName)
                    .password(passwordEncoder.encode(adminPassword))
                    .roles(new HashSet<>(Set.of("ADMIN", "USER")))
                    .permissions(new HashSet<>(Set.of("ALL_ACCESS")))
                    .isGlobalAdmin(true)
                    .accountStatus("ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(admin);
            log.info("✅ Global Admin born: " + adminEmail);
        }
    }

    private void seedReportReasons() {
        if (reportReasonRepository.count() == 0) {
            List<String> reasons = List.of(
                "Sản phẩm giả mạo, hàng nhái",
                "Nội dung phản cảm, khiêu dâm",
                "Sản phẩm bị cấm kinh doanh",
                "Dấu hiệu lừa đảo",
                "Hình ảnh không rõ ràng/sai lệch",
                "Lý do khác..."
            );
            reasons.forEach(name -> {
                ReportReason rr = ReportReason.builder().name(name).active(true).build();
                reportReasonRepository.save(rr);
            });
            log.info("✅ 6 Dynamic Report Reasons Seeded.");
        }
    }

    private List<ShippingMethod> seedShippingMethods() {
        if (shippingMethodRepository.count() > 0) return shippingMethodRepository.findAll();

        List<ShippingMethod> methods = Arrays.asList(
            ShippingMethod.builder()
                .name("Hỏa Tốc").description("Nhận hàng trong 2 giờ").baseCost(208600.0)
                .estimatedTime("Trong ngày").active(true).codEnabled(true).build(),
            ShippingMethod.builder()
                .name("Nhanh").description("Giao hàng tiêu chuẩn 24h").baseCost(28700.0)
                .estimatedTime("19 Th03 - 20 Th03").active(true).codEnabled(true).build(),
            ShippingMethod.builder()
                .name("Tiết Kiệm").description("Cước phí tối ưu cho đơn hàng nhỏ").baseCost(15000.0)
                .estimatedTime("3-5 ngày").active(true).codEnabled(true).build(),
            ShippingMethod.builder()
                .name("Hàng Cồng Kềnh").description("Dành cho sản phẩm lớn").baseCost(150000.0)
                .estimatedTime("19 Th03 - 23 Th03").active(true).codEnabled(true).build()
        );

        log.info("🚚 Global Shipping Units Seeded (4 methods).");
        return shippingMethodRepository.saveAll(methods);
    }

    private List<Category> seedCategories() {
        if (categoryRepository.count() > 0) return categoryRepository.findAll();

        List<String> catNames = Arrays.asList(
            "Máy Tính", "TiVi", "Âm Thanh", "Điện Thoại", "Dịch Vụ IT", "Máy Ảnh", 
            "Thiết Bị VP", "Thiết Bị Mạng", "Linh Kiện", "Gia Dụng", "Thời Trang", 
            "Sức Khỏe", "Sách", "Đồ Chơi", "Văn Phòng", "Thể Thao", "Làm Đẹp", "Ô Tô"
        );

        List<Category> savedCats = new ArrayList<>();
        for (String name : catNames) {
            Category c = Category.builder()
                    .name(name).slug(name.toLowerCase().replace(" ", "-")).active(true).build();
            savedCats.add(categoryRepository.save(c));
        }
        log.info("✅ 18 Categories Seeded.");
        return savedCats;
    }

    // --- 🚀 NEW: VIETNAMESE FEEDBACK TEMPLATE SEEDER ---
    private void seedFeedbackTemplates() {
        if (feedbackTemplateRepository.count() == 0) {
            log.info("Initializing professional Vietnamese feedback templates...");

            List<FeedbackTemplate> templates = Arrays.asList(
                // SELLER MODERATION TEMPLATES
                FeedbackTemplate.builder()
                        .title("Hồ sơ hợp lệ")
                        .content("Hồ sơ và các chứng từ bạn cung cấp hoàn toàn hợp lệ và đầy đủ. Chào mừng bạn gia nhập cộng đồng người bán của AiNetSoft!")
                        .type("SELLER_REJECTION")
                        .build(),
                FeedbackTemplate.builder()
                        .title("Ảnh CCCD mờ")
                        .content("Hình ảnh CCCD bạn cung cấp bị mờ, lóa sáng hoặc không rõ số. Vui lòng tải lên ảnh chụp bản gốc rõ nét và đủ ánh sáng.")
                        .type("SELLER_REJECTION")
                        .build(),
                FeedbackTemplate.builder()
                        .title("Thiếu GPKD")
                        .content("Tài khoản của bạn được đăng ký là Hộ kinh doanh/Doanh nghiệp nhưng đang thiếu ảnh Giấy phép kinh doanh. Vui lòng bổ sung để tiếp tục.")
                        .type("SELLER_REJECTION")
                        .build(),
                FeedbackTemplate.builder()
                        .title("Mã số thuế sai")
                        .content("Mã số thuế (MST) bạn cung cấp không khớp với thông tin trên trang tra cứu của Tổng cục Thuế. Vui lòng kiểm tra và cập nhật lại.")
                        .type("SELLER_REJECTION")
                        .build(),
                FeedbackTemplate.builder()
                        .title("Tọa độ GPS sai")
                        .content("Tọa độ GPS của kho hàng không trùng khớp với địa chỉ thực tế bạn đã nhập. Vui lòng định vị lại vị trí chính xác trên bản đồ.")
                        .type("SELLER_REJECTION")
                        .build(),

                // PRODUCT MODERATION TEMPLATES
                FeedbackTemplate.builder()
                        .title("Sản phẩm bị cấm")
                        .content("Sản phẩm này thuộc danh mục hàng hóa bị cấm kinh doanh theo quy định pháp luật và tiêu chuẩn cộng đồng của AiNetSoft.")
                        .type("PRODUCT_REJECTION")
                        .build(),
                FeedbackTemplate.builder()
                        .title("Ảnh chất lượng kém")
                        .content("Hình ảnh sản phẩm có chất lượng thấp, bị vỡ nét hoặc chứa logo/hình mờ của sàn thương mại điện tử khác.")
                        .type("PRODUCT_REJECTION")
                        .build()
            );

            feedbackTemplateRepository.saveAll(templates);
            log.info("✅ Seeded {} Vietnamese Quick Response Templates.", templates.size());
        }
    }

    private void seedDefaultSeller(List<Category> savedCats, List<ShippingMethod> globalMethods) {
        String sellerEmail = "seller@ainetsoft.com";
        if (!userRepository.existsByEmail(sellerEmail)) {
            
            User.AddressInfo stockAddr = User.AddressInfo.builder()
                    .receiverName("AiNetsoft Manager")
                    .phone("0909123456")
                    .province("TP.HCM (TP.HCM + Bình Dương + Bà Rịa–Vũng Tàu)")
                    .ward("Phường Bến Nghé")
                    .hamlet("Khu phố 1")
                    .detail("Tòa nhà Bitexco, Quận 1, TP.HCM")
                    .latitude("10.7715")
                    .longitude("106.7043")
                    .isDefault(true).build();

            User.BankInfo bank = User.BankInfo.builder()
                    .bankName("Vietcombank")
                    .accountNumber("1234567890")
                    .accountHolder("AINETSOFT MALL")
                    .isDefault(true).build();

            User seller = User.builder()
                    .email(sellerEmail).fullName("AiNetsoft Mall")
                    .password(passwordEncoder.encode("Test1234!"))
                    .roles(new HashSet<>(Set.of("SELLER", "USER")))
                    .sellerVerification("VERIFIED").accountStatus("ACTIVE")
                    .addresses(Collections.singletonList(stockAddr))
                    .bankAccounts(Collections.singletonList(bank))
                    .shopProfile(User.ShopProfile.builder()
                            .shopName("AiNetsoft Mall")
                            .shopSlug("ainetsoft-mall")
                            .lastShopNameChange(LocalDateTime.now())
                            .businessEmail(sellerEmail)
                            .businessPhone("0909123456")
                            .shopAddress(stockAddr.getDetail())
                            .taxCode("0102030405")
                            .enabledShippingMethodIds(globalMethods.stream().map(ShippingMethod::getId).collect(Collectors.toList()))
                            .build())
                    .build();

            userRepository.save(seller);
            log.info("✅ Default Seller Created with Slug: ainetsoft-mall");
            seedMockProducts(seller, savedCats, globalMethods);
        }
    }

    private void seedMockProducts(User seller, List<Category> savedCats, List<ShippingMethod> globalMethods) {
        if (productRepository.count() > 10 || savedCats.isEmpty()) return;

        Random rand = new Random();
        for (int i = 1; i <= 55; i++) {
            Category randomCat = savedCats.get(rand.nextInt(savedCats.size()));
            List<Product.ShippingConfig> situationalOptions = new ArrayList<>();
            
            if (globalMethods.size() >= 2) {
                situationalOptions.add(Product.ShippingConfig.builder()
                        .methodId(globalMethods.get(1).getId()).methodName(globalMethods.get(1).getName())
                        .cost(28700.0).estimatedTime("19 Th03 - 20 Th03")
                        .voucherNote("Tặng Voucher 15.000đ nếu đơn giao sau thời gian trên.").build());
            }
            
            if (i % 3 == 0 && globalMethods.size() >= 1) {
                situationalOptions.add(Product.ShippingConfig.builder()
                        .methodId(globalMethods.get(0).getId()).methodName(globalMethods.get(0).getName())
                        .cost(208600.0).estimatedTime("Ngày mai 08:00")
                        .voucherNote("Tặng Voucher 20.000đ nếu đơn giao sau thời gian trên.").build());
            }

            Product p = Product.builder()
                    .name(randomCat.getName() + " Elite Gen " + i)
                    .description("Sản phẩm chuyên nghiệp phân phối bởi AiNetsoft")
                    .price(100000 + (rand.nextInt(500) * 1000)).stock(rand.nextInt(100) + 10)
                    .categoryId(randomCat.getId()).categoryName(randomCat.getName())
                    .sellerId(seller.getId()).shopName(seller.getFullName())
                    .status("APPROVED").imageUrls(Arrays.asList("https://picsum.photos/seed/" + i + "/600/600"))
                    .shippingOptions(situationalOptions).protectionEnabled(true).allowSharing(true)
                    .favoriteCount(rand.nextInt(100)).soldCount(rand.nextInt(500) + 10)
                    .averageRating(4.0 + (rand.nextDouble() * 1.0)).reviewCount(3)
                    .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            
            Product saved = productRepository.save(p);
            seedMockReviews(saved, seller.getId());
        }
        log.info("✅ 55 Mock Products seeded with situational shipping.");
    }

    private void seedMockReviews(Product product, String sellerId) {
        Review rev1 = Review.builder()
                .productId(product.getId()).productName(product.getName()).sellerId(sellerId)
                .userName("tatoanhduc07").rating(5)
                .comment("Sản phẩm tuyệt vời! Đúng với mô tả.")
                .variantInfo("Phân loại: Size M").isVerifiedPurchase(true)
                .sellerReply("Cảm ơn Quý khách!").repliedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now().minusDays(1)).build();
        reviewRepository.save(rev1);

        Review rev2 = Review.builder()
                .productId(product.getId()).productName(product.getName()).sellerId(sellerId)
                .userName("Spam_User_99").rating(1).comment("Quảng cáo láo!!!")
                .isVerifiedPurchase(false).createdAt(LocalDateTime.now()).build();
        reviewRepository.save(rev2);

        Review rev3 = Review.builder()
                .productId(product.getId()).productName(product.getName()).sellerId(sellerId)
                .userName("lien0988324688").rating(4).comment("Chất lượng tốt, hàng đẹp.")
                .isVerifiedPurchase(true).createdAt(LocalDateTime.now().minusDays(3)).build();
        reviewRepository.save(rev3);
    }

    private void seedSubAdmin() {
        String modEmail = "mod@ainetsoft.com";
        if (!userRepository.existsByEmail(modEmail)) {
            User mod = User.builder()
                    .email(modEmail).fullName("Product Moderator")
                    .password(passwordEncoder.encode("Test1234!"))
                    .roles(new HashSet<>(Set.of("ADMIN")))
                    .permissions(new HashSet<>(Set.of("MANAGE_PRODUCTS"))) 
                    .accountStatus("ACTIVE").build();
            userRepository.save(mod);
            log.info("🛡 Sub-Admin created.");
        }
    }

    private void seedPendingModeration(List<Category> savedCats, List<ShippingMethod> globalMethods) {
        String pendingSellerEmail = "pending_seller@example.com";
        if (!userRepository.existsByEmail(pendingSellerEmail)) {
            User.AddressInfo stock1 = User.AddressInfo.builder()
                    .receiverName("Nguyễn Văn Kho")
                    .phone("0987654321")
                    .province("Hà Nội")
                    .ward("Phường Hàng Đào")
                    .hamlet("Số 1")
                    .detail("123 Phố Cổ, Hà Nội")
                    .isDefault(true).build();

            User pSeller = User.builder()
                    .email(pendingSellerEmail).fullName("Người Bán Chờ Duyệt").phone("0987654321")
                    .password(passwordEncoder.encode("Test1234!")).roles(new HashSet<>(Set.of("USER")))
                    .accountStatus("PENDING_SELLER").sellerVerification("PENDING")
                    .identityInfo(User.IdentityInfo.builder()
                            .cccdNumber("012345678912")
                            .frontImageUrl("https://picsum.photos/seed/front/400/250")
                            .backImageUrl("https://picsum.photos/seed/back/400/250")
                            .submittedAt(LocalDateTime.now()).build())
                    .addresses(Collections.singletonList(stock1))
                    .shopProfile(User.ShopProfile.builder()
                            .shopName("Shop Đang Đợi Duyệt")
                            .shopSlug("shop-dang-doi-duyet")
                            .lastShopNameChange(LocalDateTime.now())
                            .businessEmail(pendingSellerEmail)
                            .businessPhone("0987654321").shopAddress(stock1.getDetail())
                            .enabledShippingMethodIds(globalMethods.size() > 2 ? 
                                Arrays.asList(globalMethods.get(1).getId(), globalMethods.get(2).getId()) : new ArrayList<>())
                            .build())
                    .bankAccounts(Collections.singletonList(User.BankInfo.builder()
                            .bankName("Vietcombank").accountNumber("9988776655")
                            .accountHolder("NGUYEN VAN CHO DUYET").isDefault(true).build()))
                    .build();
            userRepository.save(pSeller);
            log.info("⚠️ Pending Data Seeded with Slug: shop-dang-doi-duyet");
        }
    }
}