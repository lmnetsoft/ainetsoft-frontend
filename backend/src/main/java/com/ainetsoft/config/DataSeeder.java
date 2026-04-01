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
    private final FeedbackTemplateRepository feedbackTemplateRepository;
    
    // 🚀 CMS Repository
    private final SystemContentRepository systemContentRepository;

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
        log.info("--- 🚀 Data Seeder: Initializing Production Core (2026 Ready) ---");
        
        if (forceClean) {
            cleanupDatabase();
        }

        seedGlobalAdmin();
        List<ShippingMethod> globalMethods = seedShippingMethods();
        seedReportReasons();
        seedFeedbackTemplates();

        // 🚀 UPDATED: Now using local paths for BCT Badges
        seedSystemContents();

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
        feedbackTemplateRepository.deleteAll();
        
        // 🚀 CMS Cleanup
        systemContentRepository.deleteAll();
        
        log.info("✅ Database cleaned successfully.");
    }

    // --- 🚀 UPDATED: PRODUCTION SYSTEM CONTENT SEEDER ---
    private void seedSystemContents() {
        log.info("📦 Seeding Production CMS Contents (Local Paths & Socials)...");

        // 1. Core Footer Information (Strictly as requested)
        seedIfMissing("footer_company_name", "Tên Công Ty", "CÔNG TY TNHH AINETSOFT");
        seedIfMissing("footer_address", "Địa chỉ trụ sở", "A2.804 Hưng Ngân Garden, Phường Trung Mỹ Tây, TP. Hồ Chí Minh");
        seedIfMissing("footer_hotline", "Hotline / CSKH", "1900 1234 (miễn phí) hoặc Trò chuyện trực tuyến");
        seedIfMissing("footer_representative", "Người đại diện", "Nguyễn Văn Thành");
        seedIfMissing("footer_tax_code", "Mã số thuế", "04410045333");
        seedIfMissing("footer_registration_date", "Ngày cấp đăng ký", "10/02/2026");
        seedIfMissing("footer_issuing_agency", "Nơi cấp đăng ký", "Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh");

        // 2. Production Legal Content (HTML)
        seedIfMissing("privacy", "Chính Sách Bảo Mật", "<h3>CHÍNH SÁCH BẢO MẬT</h3><p>AiNetsoft cam kết bảo vệ tuyệt đối thông tin cá nhân của bạn theo tiêu chuẩn ISO/IEC 27001...</p>");
        seedIfMissing("terms", "Quy Chế Hoạt Động", "<h3>QUY CHẾ HOẠT ĐỘNG</h3><p>Quy định về giao dịch, thanh toán và an toàn trên sàn TMĐT AiNetsoft...</p>");
        seedIfMissing("shipping-policy", "Chính Sách Vận Chuyển", "<h3>CHÍNH SÁCH VẬN CHUYỂN</h3><p>Hợp tác cùng các đơn vị vận chuyển hàng đầu, giao hàng nhanh chóng 2-4 ngày...</p>");
        seedIfMissing("return-policy", "Chính Sách Trả Hàng", "<h3>CHÍNH SÁCH ĐỔI TRẢ</h3><p>Hỗ trợ đổi trả hàng và hoàn tiền trong vòng 07 ngày nếu lỗi từ nhà sản xuất...</p>");

        // 3. Social Media Links
        seedIfMissing("social_youtube", "Link YouTube", "https://youtube.com/@ainetsoft");
        seedIfMissing("social_facebook", "Link Facebook", "https://facebook.com/ainetsoft.official");

        // 4. App Links & QR Code (JSON Format)
        String iosJson = "{\"img\":\"https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg\",\"link\":\"https://www.apple.com/vn/app-store/\"}";
        String androidJson = "{\"img\":\"https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg\",\"link\":\"https://play.google.com/store/apps\"}";
        String qrJson = "{\"img\":\"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ainetsoft.vn\",\"link\":\"https://ainetsoft.vn\"}";

        seedIfMissing("app_ios_link", "App: iOS Store", iosJson);
        seedIfMissing("app_android_link", "App: Android Store", androidJson);
        seedIfMissing("app_qr_code", "App: QR Code", qrJson);

        // 5. 🚀 UPDATED: BCT Badges (Using Local Path as requested)
        String localBctLogo = "http://localhost:8080/uploads/system/logo-bct.png";
        
        String bct1Json = "{\"img\":\"" + localBctLogo + "\",\"link\":\"http://online.gov.vn/\"}";
        String bct2Json = "{\"img\":\"" + localBctLogo + "\",\"link\":\"http://online.gov.vn/\"}";
        // Keeping Zalo as Zalo has its own icon
        String bct3Json = "{\"img\":\"https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg\",\"link\":\"https://zalo.me/0909123456\"}";

        seedIfMissing("footer_badge_1", "Badge BCT 1 (Link)", bct1Json);
        seedIfMissing("footer_badge_2", "Badge BCT 2 (Link)", bct2Json);
        seedIfMissing("footer_badge_3", "Badge BCT 3 / Icon Phụ", bct3Json);

        log.info("✅ Full Production System Contents Seeded.");
    }

    private void seedIfMissing(String slug, String title, String content) {
        if (!systemContentRepository.existsBySlug(slug)) {
            systemContentRepository.save(SystemContent.builder().slug(slug).title(title).htmlContent(content).lastUpdated(LocalDateTime.now()).build());
        }
    }

    private void seedGlobalAdmin() {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder().email(adminEmail).fullName(adminFullName).password(passwordEncoder.encode(adminPassword)).roles(new HashSet<>(Set.of("ADMIN", "USER"))).permissions(new HashSet<>(Set.of("ALL_ACCESS"))).isGlobalAdmin(true).accountStatus("ACTIVE").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            userRepository.save(admin);
            log.info("✅ Global Admin born: " + adminEmail);
        }
    }

    private void seedReportReasons() {
        if (reportReasonRepository.count() == 0) {
            List<String> reasons = List.of("Sản phẩm giả mạo, hàng nhái", "Nội dung phản cảm, khiêu dâm", "Sản phẩm bị cấm kinh doanh", "Dấu hiệu lừa đảo", "Hình ảnh không rõ ràng/sai lệch", "Lý do khác...");
            reasons.forEach(name -> reportReasonRepository.save(ReportReason.builder().name(name).active(true).build()));
            log.info("✅ 6 Dynamic Report Reasons Seeded.");
        }
    }

    private List<ShippingMethod> seedShippingMethods() {
        if (shippingMethodRepository.count() > 0) return shippingMethodRepository.findAll();
        List<ShippingMethod> methods = Arrays.asList(
            ShippingMethod.builder().name("Hỏa Tốc").description("Nhận hàng trong 2 giờ").baseCost(208600.0).estimatedTime("Trong ngày").active(true).codEnabled(true).build(),
            ShippingMethod.builder().name("Nhanh").description("Giao hàng tiêu chuẩn 24h").baseCost(28700.0).estimatedTime("19 Th03 - 20 Th03").active(true).codEnabled(true).build(),
            ShippingMethod.builder().name("Tiết Kiệm").description("Cước phí tối ưu cho đơn hàng nhỏ").baseCost(15000.0).estimatedTime("3-5 ngày").active(true).codEnabled(true).build(),
            ShippingMethod.builder().name("Hàng Cồng Kềnh").description("Dành cho sản phẩm lớn").baseCost(150000.0).estimatedTime("19 Th03 - 23 Th03").active(true).codEnabled(true).build()
        );
        log.info("🚚 Global Shipping Units Seeded (4 methods).");
        return shippingMethodRepository.saveAll(methods);
    }

    private List<Category> seedCategories() {
        if (categoryRepository.count() > 0) return categoryRepository.findAll();
        List<String> catNames = Arrays.asList("Máy Tính", "TiVi", "Âm Thanh", "Điện Thoại", "Dịch Vụ IT", "Máy Ảnh", "Thiết Bị VP", "Thiết Bị Mạng", "Linh Kiện", "Gia Dụng", "Thời Trang", "Sức Khỏe", "Sách", "Đồ Chơi", "Văn Phòng", "Thể Thao", "Làm Đẹp", "Ô Tô");
        List<Category> savedCats = new ArrayList<>();
        for (String name : catNames) {
            Category c = Category.builder().name(name).slug(name.toLowerCase().replace(" ", "-")).active(true).build();
            savedCats.add(categoryRepository.save(c));
        }
        log.info("✅ 18 Categories Seeded.");
        return savedCats;
    }

    private void seedFeedbackTemplates() {
        if (feedbackTemplateRepository.count() == 0) {
            log.info("Initializing professional Vietnamese feedback templates...");
            List<FeedbackTemplate> templates = Arrays.asList(
                FeedbackTemplate.builder().title("Hồ sơ hợp lệ").content("Hồ sơ và các chứng từ bạn cung cấp hoàn toàn hợp lệ và đầy đủ. Chào mừng bạn gia nhập cộng đồng người bán của AiNetSoft!").type("SELLER_REJECTION").build(),
                FeedbackTemplate.builder().title("Ảnh CCCD mờ").content("Hình ảnh CCCD bạn cung cấp bị mờ, lóa sáng hoặc không rõ số. Vui lòng tải lên ảnh chụp bản gốc rõ nét và đủ ánh sáng.").type("SELLER_REJECTION").build(),
                FeedbackTemplate.builder().title("Thiếu GPKD").content("Tài khoản của bạn được đăng ký là Hộ kinh doanh/Doanh nghiệp nhưng đang thiếu ảnh Giấy phép kinh doanh. Vui lòng bổ sung để tiếp tục.").type("SELLER_REJECTION").build(),
                FeedbackTemplate.builder().title("Mã số thuế sai").content("Mã số thuế (MST) bạn cung cấp không khớp với thông tin trên trang tra cứu của Tổng cục Thuế. Vui lòng kiểm tra và cập nhật lại.").type("SELLER_REJECTION").build(),
                FeedbackTemplate.builder().title("Tọa độ GPS sai").content("Tọa độ GPS của kho hàng không trùng khớp với địa chỉ thực tế bạn đã nhập. Vui lòng định vị lại vị trí chính xác trên bản đồ.").type("SELLER_REJECTION").build(),
                FeedbackTemplate.builder().title("Sản phẩm bị cấm").content("Sản phẩm này thuộc danh mục hàng hóa bị cấm kinh doanh theo quy định pháp luật và tiêu chuẩn cộng đồng của AiNetSoft.").type("PRODUCT_REJECTION").build(),
                FeedbackTemplate.builder().title("Ảnh chất lượng kém").content("Hình ảnh sản phẩm có chất lượng thấp, bị vỡ nét hoặc chứa logo/hình mờ của sàn thương mại điện tử khác.").type("PRODUCT_REJECTION").build()
            );
            feedbackTemplateRepository.saveAll(templates);
            log.info("✅ Seeded Vietnamese Feedback Templates.");
        }
    }

    private void seedDefaultSeller(List<Category> savedCats, List<ShippingMethod> globalMethods) {
        String sellerEmail = "seller@ainetsoft.com";
        if (!userRepository.existsByEmail(sellerEmail)) {
            User.AddressInfo stockAddr = User.AddressInfo.builder().receiverName("AiNetsoft Manager").phone("0909123456").province("TP.HCM (TP.HCM + Bình Dương + Bà Rịa–Vũng Tàu)").ward("Phường Bến Nghé").hamlet("Khu phố 1").detail("Tòa nhà Bitexco, Quận 1, TP.HCM").latitude("10.7715").longitude("106.7043").isDefault(true).build();
            User.BankInfo bank = User.BankInfo.builder().bankName("Vietcombank").accountNumber("1234567890").accountHolder("AINETSOFT MALL").isDefault(true).build();
            User seller = User.builder().email(sellerEmail).fullName("AiNetsoft Mall").password(passwordEncoder.encode("Test1234!")).roles(new HashSet<>(Set.of("SELLER", "USER"))).sellerVerification("VERIFIED").accountStatus("ACTIVE").addresses(Collections.singletonList(stockAddr)).bankAccounts(Collections.singletonList(bank)).shopProfile(User.ShopProfile.builder().shopName("AiNetsoft Mall").shopSlug("ainetsoft-mall").lastShopNameChange(LocalDateTime.now()).businessEmail(sellerEmail).businessPhone("0909123456").shopAddress(stockAddr.getDetail()).taxCode("0102030405").enabledShippingMethodIds(globalMethods.stream().map(ShippingMethod::getId).collect(Collectors.toList())).build()).build();
            userRepository.save(seller);
            log.info("✅ Default Seller Created.");
            seedMockProducts(seller, savedCats, globalMethods);
        }
    }

    private void seedMockProducts(User seller, List<Category> savedCats, List<ShippingMethod> globalMethods) {
        if (productRepository.count() > 10 || savedCats.isEmpty()) return;
        Random rand = new Random();
        for (int i = 1; i <= 55; i++) {
            Category randomCat = savedCats.get(rand.nextInt(savedCats.size()));
            List<Product.ShippingConfig> situationalOptions = new ArrayList<>();
            if (globalMethods.size() >= 2) { situationalOptions.add(Product.ShippingConfig.builder().methodId(globalMethods.get(1).getId()).methodName(globalMethods.get(1).getName()).cost(28700.0).estimatedTime("19 Th03 - 20 Th03").voucherNote("Tặng Voucher 15.000đ nếu đơn giao sau thời gian trên.").build()); }
            if (i % 3 == 0 && globalMethods.size() >= 1) { situationalOptions.add(Product.ShippingConfig.builder().methodId(globalMethods.get(0).getId()).methodName(globalMethods.get(0).getName()).cost(208600.0).estimatedTime("Ngày mai 08:00").voucherNote("Tặng Voucher 20.000đ nếu đơn giao sau thời gian trên.").build()); }
            Product p = Product.builder().name(randomCat.getName() + " Elite Gen " + i).description("Sản phẩm chuyên nghiệp phân phối bởi AiNetsoft").price(100000 + (rand.nextInt(500) * 1000)).stock(rand.nextInt(100) + 10).categoryId(randomCat.getId()).categoryName(randomCat.getName()).sellerId(seller.getId()).shopName(seller.getFullName()).status("APPROVED").imageUrls(Arrays.asList("https://picsum.photos/seed/" + i + "/600/600")).shippingOptions(situationalOptions).protectionEnabled(true).allowSharing(true).favoriteCount(rand.nextInt(100)).soldCount(rand.nextInt(500) + 10).averageRating(4.0 + (rand.nextDouble() * 1.0)).reviewCount(3).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            Product saved = productRepository.save(p);
            seedMockReviews(saved, seller.getId());
        }
        log.info("✅ 55 Mock Products seeded.");
    }

    private void seedMockReviews(Product product, String sellerId) {
        Review rev1 = Review.builder().productId(product.getId()).productName(product.getName()).sellerId(sellerId).userName("tatoanhduc07").rating(5).comment("Sản phẩm tuyệt vời! Đúng với mô tả.").variantInfo("Phân loại: Size M").isVerifiedPurchase(true).sellerReply("Cảm ơn Quý khách!").repliedAt(LocalDateTime.now()).createdAt(LocalDateTime.now().minusDays(1)).build();
        reviewRepository.save(rev1);
        Review rev2 = Review.builder().productId(product.getId()).productName(product.getName()).sellerId(sellerId).userName("Spam_User_99").rating(1).comment("Quảng cáo láo!!!").isVerifiedPurchase(false).createdAt(LocalDateTime.now()).build();
        reviewRepository.save(rev2);
        Review rev3 = Review.builder().productId(product.getId()).productName(product.getName()).sellerId(sellerId).userName("lien0988324688").rating(4).comment("Chất lượng tốt, hàng đẹp.").isVerifiedPurchase(true).createdAt(LocalDateTime.now().minusDays(3)).build();
        reviewRepository.save(rev3);
    }

    private void seedSubAdmin() {
        if (!userRepository.existsByEmail("mod@ainetsoft.com")) {
            userRepository.save(User.builder().email("mod@ainetsoft.com").fullName("Product Moderator").password(passwordEncoder.encode("Test1234!")).roles(new HashSet<>(Set.of("ADMIN"))).permissions(new HashSet<>(Set.of("MANAGE_PRODUCTS"))).accountStatus("ACTIVE").build());
        }
    }

    private void seedPendingModeration(List<Category> savedCats, List<ShippingMethod> globalMethods) {
        if (!userRepository.existsByEmail("pending_seller@example.com")) {
            User.AddressInfo stock1 = User.AddressInfo.builder().receiverName("Nguyễn Văn Kho").phone("0987654321").province("Hà Nội").ward("Phường Hàng Đào").hamlet("Số 1").detail("123 Phố Cổ, Hà Nội").isDefault(true).build();
            User pSeller = User.builder().email("pending_seller@example.com").fullName("Người Bán Chờ Duyệt").phone("0987654321").password(passwordEncoder.encode("Test1234!")).roles(new HashSet<>(Set.of("USER"))).accountStatus("PENDING_SELLER").sellerVerification("PENDING").identityInfo(User.IdentityInfo.builder().cccdNumber("012345678912").frontImageUrl("https://picsum.photos/seed/front/400/250").backImageUrl("https://picsum.photos/seed/back/400/250").submittedAt(LocalDateTime.now()).build()).addresses(Collections.singletonList(stock1)).shopProfile(User.ShopProfile.builder().shopName("Shop Đang Đợi Duyệt").shopSlug("shop-dang-doi-duyet").lastShopNameChange(LocalDateTime.now()).businessEmail("pending_seller@example.com").businessPhone("0987654321").shopAddress(stock1.getDetail()).enabledShippingMethodIds(globalMethods.size() > 2 ? Arrays.asList(globalMethods.get(1).getId(), globalMethods.get(2).getId()) : new ArrayList<>()).build()).bankAccounts(Collections.singletonList(User.BankInfo.builder().bankName("Vietcombank").accountNumber("9988776655").accountHolder("NGUYEN VAN CHO DUYET").isDefault(true).build())).build();
            userRepository.save(pSeller);
        }
    }
}