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
    
    private final SystemContentRepository systemContentRepository;
    private final FooterIconRepository footerIconRepository;
    private final ContentNodeRepository helpNodeRepository;
    private final FooterMenuRepository footerMenuRepository;

    private final OrderRepository orderRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final BankAccountRepository bankAccountRepository; 
    
    private final VoucherRepository voucherRepository;
    private final WalletRepository walletRepository;

    @Value("${app.seed.mock-data:true}")
    private boolean seedMockData;

    @Value("${app.seed.force-clean:false}")
    private boolean forceClean;

    @Value("${admin.setup.email:admin@ainetsoft.com}")
    private String adminEmail;

    @Value("${admin.setup.password:Test1234!}")
    private String adminPassword;

    @Value("${admin.setup.fullname:Global Administrator}")
    private String adminFullName;

    private final String localDomain = "http://localhost:8080";

    @Override
    public void run(String... args) throws Exception {
        log.info("--- 🚀 Data Seeder: Initializing Deep Sync Production Core ---");
        
        if (forceClean) cleanupDatabase();

        seedGlobalAdmin();
        
        List<ShippingMethod> globalMethods = seedShippingMethods();
        seedReportReasons();
        seedFeedbackTemplates();

        seedSystemContents(); 
        seedHelpTree();       
        seedFooterMenus();    
        seedFooterIcons();    

        if (seedMockData) {
            List<Category> savedCats = seedCategories();
            seedDefaultSellers(savedCats, globalMethods); 
            seedPendingModeration(savedCats, globalMethods);
            seedSubAdmin();
            seedRegularUsers();
            seedBankAccounts();      
            seedWithdrawalTestData(); 
            
            // 🚀 MARKETING ENGINE SETUP
            seedVouchersAndWallets();
        }
        
        log.info("✅ SUCCESS: DataSeeder has executed perfectly.");
    }

    private void cleanupDatabase() {
        log.warn("⚠️ FORCE CLEAN ENABLED: Wiping all collections...");
        productRepository.deleteAll();
        reviewRepository.deleteAll();
        categoryRepository.deleteAll();
        reportReasonRepository.deleteAll();
        productReportRepository.deleteAll();
        userRepository.deleteAll(); 
        shippingMethodRepository.deleteAll(); 
        feedbackTemplateRepository.deleteAll();
        systemContentRepository.deleteAll();
        footerIconRepository.deleteAll();
        helpNodeRepository.deleteAll();
        footerMenuRepository.deleteAll();
        orderRepository.deleteAll();
        withdrawalRepository.deleteAll();
        bankAccountRepository.deleteAll(); 
        voucherRepository.deleteAll();
        walletRepository.deleteAll();
    }

    private void seedVouchersAndWallets() {
        voucherRepository.deleteAll();
        
        User sellerA = userRepository.findByEmail("seller_a@ainetsoft.com").orElse(null);
        User sellerB = userRepository.findByEmail("seller_b@ainetsoft.com").orElse(null);
        User buyer = userRepository.findByEmail("user@ainetsoft.com").orElse(null);
        User noBankUser = userRepository.findByEmail("nobank@ainetsoft.com").orElse(null);

        if (buyer == null) return;

        Voucher platformVoucher = Voucher.builder()
                .type(Voucher.VoucherType.SYSTEM)
                .code("SYSTEM20K")
                .shopName("AiNetsoft Official")
                .title("MÃ SÀN: Giảm 20k")
                .discountType("FIXED_AMOUNT")
                .discountValue(20000.0)
                .minOrderValue(50000.0)
                .usageLimit(1000)
                .usedCount(0)
                .validFrom(LocalDateTime.now().minusDays(2))
                .validUntil(LocalDateTime.now().plusMonths(1))
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .collectedUserIds(new HashSet<>(Arrays.asList(buyer.getId())))
                .build();

        Voucher shopVoucherA = Voucher.builder()
                .type(Voucher.VoucherType.SELLER)
                .code("HITECH10") 
                .sellerId(sellerA != null ? sellerA.getId() : null)
                .shopName(sellerA != null ? sellerA.getShopProfile().getShopName() : "Hitech Center")
                .title("MÃ SHOP: Giảm 10% (Tối đa 30k)")
                .discountType("PERCENTAGE")
                .discountValue(10.0)
                .maxDiscountAmount(30000.0)
                .minOrderValue(100000.0)
                .usageLimit(1000)
                .usedCount(0)
                .validFrom(LocalDateTime.now().minusHours(5))
                .validUntil(LocalDateTime.now().plusMonths(1))
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .collectedUserIds(new HashSet<>(Arrays.asList(buyer.getId())))
                .build();
                
        Voucher shopVoucherB = Voucher.builder()
                .type(Voucher.VoucherType.SELLER)
                .code("FASHION50") 
                .sellerId(sellerB != null ? sellerB.getId() : null)
                .shopName(sellerB != null ? sellerB.getShopProfile().getShopName() : "Fashion World")
                .title("MÃ SHOP: Giảm 50k")
                .discountType("FIXED_AMOUNT")
                .discountValue(50000.0)
                .maxDiscountAmount(0.0)
                .minOrderValue(150000.0)
                .usageLimit(1000)
                .usedCount(0)
                .validFrom(LocalDateTime.now().minusHours(5))
                .validUntil(LocalDateTime.now().plusMonths(1))
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .collectedUserIds(new HashSet<>(Arrays.asList(buyer.getId())))
                .build();

        Voucher freeshipVoucher = Voucher.builder()
                .type(Voucher.VoucherType.FREESHIP)
                .code("FREESHIP15K") 
                .shopName("AiNetsoft Express")
                .title("MÃ VẬN CHUYỂN: Giảm 15k phí Ship")
                .discountType("FIXED_AMOUNT")
                .discountValue(15000.0)
                .minOrderValue(0.0)
                .usageLimit(1000)
                .usedCount(0)
                .validFrom(LocalDateTime.now().minusHours(1))
                .validUntil(LocalDateTime.now().plusMonths(1))
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .collectedUserIds(new HashSet<>(Arrays.asList(buyer.getId())))
                .build();

        Voucher hiddenLivestreamVoucher = Voucher.builder()
                .type(Voucher.VoucherType.SYSTEM)
                .code("LIVESTREAM50K") 
                .shopName("AiNetsoft Official")
                .title("MÃ BÍ MẬT: Tặng ngay 50k")
                .discountType("FIXED_AMOUNT")
                .discountValue(50000.0)
                .minOrderValue(100000.0)
                .usageLimit(500)
                .usedCount(0)
                .validFrom(LocalDateTime.now().minusHours(1))
                .validUntil(LocalDateTime.now().plusMonths(1))
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .collectedUserIds(new HashSet<>()) 
                .build();

        List<Voucher> allVouchersToSave = new ArrayList<>(Arrays.asList(
            platformVoucher, shopVoucherA, shopVoucherB, freeshipVoucher, hiddenLivestreamVoucher
        ));

        for (int i = 1; i <= 10; i++) {
            allVouchersToSave.add(Voucher.builder()
                    .type(Voucher.VoucherType.SELLER)
                    .code("HITECH-AUTO-" + i)
                    .sellerId(sellerA != null ? sellerA.getId() : null)
                    .shopName(sellerA != null ? sellerA.getShopProfile().getShopName() : "Hitech Center")
                    .title("MÃ SHOP: Giảm " + (i * 5) + "%")
                    .discountType("PERCENTAGE")
                    .discountValue((double) (i * 5))
                    .maxDiscountAmount(30000.0)
                    .minOrderValue(100000.0)
                    .usageLimit(1000).usedCount(0)
                    .validFrom(LocalDateTime.now().minusHours(5)).validUntil(LocalDateTime.now().plusMonths(1))
                    .isActive(true).createdAt(LocalDateTime.now())
                    .collectedUserIds(new HashSet<>())
                    .build());
        }

        for (int i = 1; i <= 10; i++) {
            allVouchersToSave.add(Voucher.builder()
                    .type(Voucher.VoucherType.SELLER)
                    .code("FASHION-AUTO-" + i)
                    .sellerId(sellerB != null ? sellerB.getId() : null)
                    .shopName(sellerB != null ? sellerB.getShopProfile().getShopName() : "Fashion World")
                    .title("MÃ SHOP: Giảm " + (i * 10) + "k")
                    .discountType("FIXED_AMOUNT")
                    .discountValue((double) (i * 10000))
                    .maxDiscountAmount(0.0).minOrderValue(150000.0)
                    .usageLimit(1000).usedCount(0)
                    .validFrom(LocalDateTime.now().minusHours(5)).validUntil(LocalDateTime.now().plusMonths(1))
                    .isActive(true).createdAt(LocalDateTime.now())
                    .collectedUserIds(new HashSet<>())
                    .build());
        }

        List<Voucher> savedVouchers = voucherRepository.saveAll(allVouchersToSave);

        List<String> savedIds = Arrays.asList(savedVouchers.get(0).getId(), savedVouchers.get(1).getId(), savedVouchers.get(2).getId(), savedVouchers.get(3).getId());
        
        // 🚀 WALLET CHO TEST CONSUMER (CÓ BANK)
        Optional<Wallet> existingWallet = walletRepository.findByUserId(buyer.getId());
        if (existingWallet.isEmpty()) {
            Wallet wallet = Wallet.builder()
                    .userId(buyer.getId())
                    .coinBalance(100000) 
                    .balance(500000.0)
                    .savedVoucherIds(new ArrayList<>(savedIds))
                    .updatedAt(LocalDateTime.now())
                    .build();
            walletRepository.save(wallet);
        } else {
             Wallet w = existingWallet.get();
             w.setCoinBalance(100000);
             w.setBalance(500000.0);
             w.setSavedVoucherIds(new ArrayList<>(savedIds));
             walletRepository.save(w);
        }
        
        buyer.setCoinBalance(100000);
        buyer.setSavedVoucherIds(new HashSet<>(savedIds));
        userRepository.save(buyer);

        // 🚀 WALLET CHO NOBANK CONSUMER (KHÔNG CÓ BANK NHƯNG CÓ TIỀN)
        if (noBankUser != null) {
            Optional<Wallet> noBankWallet = walletRepository.findByUserId(noBankUser.getId());
            if (noBankWallet.isEmpty()) {
                Wallet wallet = Wallet.builder()
                        .userId(noBankUser.getId())
                        .coinBalance(50000) 
                        .balance(300000.0) // 300k VNĐ để test báo lỗi không có Bank
                        .savedVoucherIds(new ArrayList<>())
                        .updatedAt(LocalDateTime.now())
                        .build();
                walletRepository.save(wallet);
            } else {
                Wallet w = noBankWallet.get();
                w.setCoinBalance(50000);
                w.setBalance(300000.0);
                walletRepository.save(w);
            }
            noBankUser.setCoinBalance(50000);
            userRepository.save(noBankUser);
        }
    }
    
    private void seedIfMissing(String slug, String title, String content) {
            if (!systemContentRepository.existsBySlug(slug)) {
                SystemContent sc = new SystemContent();
                sc.setSlug(slug); 
                sc.setTitle(title); 
                sc.setHtmlContent(content);
                sc.setLastUpdated(LocalDateTime.now());
                systemContentRepository.save(sc);
            }
        }
        
    private void seedSystemContents() {
        seedIfMissing("shipping-policy", "Chính Sách Vận Chuyển AiNetsoft", "<article><h3>Quy trình giao nhận chuyên nghiệp</h3><p>Chúng tôi đảm bảo hàng hóa được đóng gói cẩn thận và bàn giao cho đơn vị vận chuyển trong vòng 24h.</p><h4>Danh sách đối tác tin cậy</h4><ul><li>SPX Express</li><li>GHTK</li><li>Viettel Post</li></ul></article>");
        seedIfMissing("phi-van-chuyen", "Hướng dẫn tính phí vận chuyển", "<article><h3>Cơ chế phí ship minh bạch</h3><p>Phí vận chuyển được tính dựa trên cân nặng thực tế hoặc cân nặng quy đổi của kiện hàng.</p></article>");
        seedIfMissing("thoi-gian-giao-hang", "Thời gian nhận hàng dự kiến", "<article><h3>Cam kết tiến độ giao hàng</h3><p>Khu vực nội thành: Giao nhanh 24h.<br>Khu vực vùng sâu vùng xa: 5-7 ngày làm việc.</p></article>");
        seedIfMissing("legal", "Trung Tâm Pháp Lý & Bảo Mật AiNetsoft", "<article><h3>Cam kết tuân thủ pháp luật</h3><p>AiNetsoft luôn đặt tính minh bạch và bảo mật thông tin khách hàng lên hàng đầu.</p><p>Vui lòng xem chi tiết Điều khoản dịch vụ và Chính sách bảo mật ở menu bên trái.</p></article>");
        seedIfMissing("terms", "Điều Khoản Sử Dụng Dịch Vụ AiNetsoft", "<article><h3>Thỏa thuận sử dụng nền tảng</h3><p>Bằng việc truy cập ứng dụng AiNetsoft, bạn đồng ý với các quy tắc giao dịch công bằng của chúng tôi.</p></article>");
        seedIfMissing("privacy", "Chính Sách Bảo Mật Thông Tin", "<article><h3>Bảo vệ quyền riêng tư</h3><p>Mọi thông tin cá nhân của bạn được mã hóa 256-bit và cam kết không chia sẻ cho bên thứ ba.</p></article>");
        seedIfMissing("trach-nhiem-nguoi-dung", "Trách nhiệm của khách hàng", "<article><h3>Quy tắc mua sắm an toàn</h3><p>Khách hàng cần bảo mật thông tin tài khoản và chịu trách nhiệm về các giao dịch phát sinh.</p></article>");
        seedIfMissing("return-policy", "Quy Định Trả Hàng & Hoàn Tiền", "<article><h3>Chính sách hoàn trả dễ dàng</h3><p>Người mua có quyền yêu cầu trả hàng trong vòng 7 ngày nếu có bằng chứng video mở hộp.</p></article>");
        seedIfMissing("huong-dan-hoan-tien", "Quy trình nhận lại tiền hoàn", "<article><h3>Phương thức tài chính</h3><p>Tiền sẽ được hoàn trả về Ví AiNetsoft hoặc tài khoản ngân hàng của bạn trong 3-5 ngày làm việc.</p></article>");
        seedIfMissing("tai-khoan", "Trung Tâm Hỗ Trợ Tài Khoản", "<h3>Quản lý hồ sơ</h3><p>Hướng dẫn cập nhật thông tin cá nhân, địa chỉ và bảo mật 2 lớp.</p>");
        seedIfMissing("doi-mat-khau", "Quy trình thay đổi mật khẩu", "<h3>Bảo mật tài khoản</h3><p>Vào Cài đặt -> Bảo mật để cập nhật mật khẩu mới.</p>");
        seedIfMissing("mua-sam", "Cẩm nang mua sắm thông minh tại AiNetsoft", "<h3>Khám phá ưu đãi</h3><p>Hướng dẫn săn Deal, sử dụng Voucher và tham gia livestream bán hàng.</p>");
        seedIfMissing("huong-dan-dat-hang", "Cách đặt hàng chi tiết 2026", "<article><h3>5 bước đặt hàng nhanh chóng</h3><p>1. Tìm sản phẩm -> 2. Xem Feedback -> 3. Thêm vào giỏ -> 4. Chọn thanh toán -> 5. Theo dõi vận chuyển.</p></article>");
        seedIfMissing("about-us", "Giới thiệu về Hệ sinh thái AiNetsoft", "<h3>Tầm nhìn 2026</h3><p>Trở thành nền tảng thương mại điện tử kết nối thông minh nhất Việt Nam.</p>");
        seedIfMissing("careers", "Cơ hội nghề nghiệp tại AiNetsoft", "<h3>Gia nhập đội ngũ</h3><p>Chúng tôi luôn tìm kiếm những tài năng trẻ trong lĩnh vực AI và E-commerce.</p>");
        seedIfMissing("van-hoa-cong-ty", "Văn hóa doanh nghiệp AiNetsoft", "<h3>Môi trường làm việc</h3><p>Linh hoạt, sáng tạo, và luôn lấy con người làm trọng tâm.</p>");
        seedIfMissing("footer_company_name", "Tên Công Ty", "CÔNG TY TNHH AINETSOFT VIỆT NAM");
        seedIfMissing("footer_address", "Địa chỉ trụ sở", "A2.804 Hưng Ngân Garden, Dương Thị Mười, Trung Mỹ Tây, TP. Hồ Chí Minh, Việt Nam");
        seedIfMissing("footer_hotline", "Hotline / CSKH", "1900 12336 (miễn phí)");
        seedIfMissing("footer_representative", "Người đại diện", "Nguyễn Văn Thành");
        seedIfMissing("footer_tax_code", "Mã số thuế", "04410045331");
        seedIfMissing("footer_registration_date", "Ngày cấp đăng ký", "10/02/2024");
        seedIfMissing("footer_issuing_agency", "Nơi cấp đăng ký", "Sở KH&ĐT TP. Hồ Chí Minh");
        seedIfMissing("social_youtube", "YouTube Official", "https://youtube.com/@ainetsoft");
        seedIfMissing("social_facebook", "Facebook Official", "https://facebook.com/ainetsoft.official");

        String pathBct = localDomain + "/uploads/system/logo-bct.png";
        String pathZalo = localDomain + "/uploads/system/zalo_logo.png";
        seedIfMissing("footer_badge_1", "Badge BCT 1 (Link)", "{\"img\":\"" + pathBct + "\",\"link\":\"https://online.gov.vn/Home/WebDetails/123\"}");
        seedIfMissing("footer_badge_2", "Badge BCT 2 (Link)", "{\"img\":\"" + pathBct + "\",\"link\":\"https://online.gov.vn/Home/AppDetails/456\"}");
        seedIfMissing("footer_badge_3", "Badge BCT 3 / Icon Phụ", "{\"img\":\"" + pathZalo + "\",\"link\":\"https://zalo.me/0909123456\"}");
        seedIfMissing("app_qr_code", "App: QR Code", "{\"img\":\"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://ainetsoft.com\",\"link\":\"https://ainetsoft.com/download\"}");
        seedIfMissing("app_ios_link", "App: iOS Store", "{\"img\":\"https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg\",\"link\":\"https://ainetsoft.com/ios\"}");
        seedIfMissing("app_android_link", "App: Android Store", "{\"img\":\"https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg\",\"link\":\"https://ainetsoft.com/android\"}");
    }

    private void seedHelpTree() {
        if (helpNodeRepository.count() > 0) return;
        ContentNode cat1 = new ContentNode(); cat1.setTitle("Mua Sắm & Thanh Toán"); cat1.setSlug("mua-sam"); cat1.setType("CATEGORY"); cat1.setDisplayOrder(1); cat1 = helpNodeRepository.save(cat1);
        ContentNode cat1_s1 = new ContentNode(); cat1_s1.setTitle("Cách đặt hàng"); cat1_s1.setSlug("huong-dan-dat-hang"); cat1_s1.setType("ARTICLE"); cat1_s1.setParentId(cat1.getId()); cat1_s1.setDisplayOrder(1); helpNodeRepository.save(cat1_s1);
        ContentNode cat1_s2 = new ContentNode(); cat1_s2.setTitle("Các phương thức thanh toán"); cat1_s2.setSlug("phi-van-chuyen"); cat1_s2.setType("ARTICLE"); cat1_s2.setParentId(cat1.getId()); cat1_s2.setDisplayOrder(2); helpNodeRepository.save(cat1_s2);

        ContentNode cat2 = new ContentNode(); cat2.setTitle("Vận Chuyển & Giao Nhận"); cat2.setSlug("shipping-policy"); cat2.setType("CATEGORY"); cat2.setDisplayOrder(2); cat2 = helpNodeRepository.save(cat2);
        ContentNode cat2_s1 = new ContentNode(); cat2_s1.setTitle("Thông tin chung"); cat2_s1.setSlug("shipping-policy"); cat2_s1.setType("ARTICLE"); cat2_s1.setParentId(cat2.getId()); cat2_s1.setDisplayOrder(1); helpNodeRepository.save(cat2_s1);
        ContentNode cat2_s2 = new ContentNode(); cat2_s2.setTitle("Chi phí vận chuyển"); cat2_s2.setSlug("phi-van-chuyen"); cat2_s2.setType("ARTICLE"); cat2_s2.setParentId(cat2.getId()); cat2_s2.setDisplayOrder(2); helpNodeRepository.save(cat2_s2);
        ContentNode cat2_s3 = new ContentNode(); cat2_s3.setTitle("Thời gian giao hàng"); cat2_s3.setSlug("thoi-gian-giao-hang"); cat2_s3.setType("ARTICLE"); cat2_s2.setParentId(cat2.getId()); cat2_s3.setDisplayOrder(3); helpNodeRepository.save(cat2_s3);

        ContentNode cat3 = new ContentNode(); cat3.setTitle("Trả Hàng & Hoàn Tiền"); cat3.setSlug("return-policy"); cat3.setType("CATEGORY"); cat3.setDisplayOrder(3); cat3 = helpNodeRepository.save(cat3);
        ContentNode cat3_s1 = new ContentNode(); cat3_s1.setTitle("Quy định chung"); cat3_s1.setSlug("return-policy"); cat3_s1.setType("ARTICLE"); cat3_s1.setParentId(cat3.getId()); cat3_s1.setDisplayOrder(1); helpNodeRepository.save(cat3_s1);
        ContentNode cat3_s2 = new ContentNode(); cat3_s2.setTitle("Hướng dẫn hoàn tiền"); cat3_s2.setSlug("huong-dan-hoan-tien"); cat3_s2.setType("ARTICLE"); cat3_s2.setParentId(cat3.getId()); cat3_s2.setDisplayOrder(2); helpNodeRepository.save(cat3_s2);

        ContentNode cat4 = new ContentNode(); cat4.setTitle("Quản Lý Tài Khoản"); cat4.setSlug("tai-khoan"); cat4.setType("CATEGORY"); cat4.setDisplayOrder(4); cat4 = helpNodeRepository.save(cat4);
        ContentNode cat4_s1 = new ContentNode(); cat4_s1.setTitle("Thông tin cá nhân"); cat4_s1.setSlug("tai-khoan"); cat4_s1.setType("ARTICLE"); cat4_s1.setParentId(cat4.getId()); cat4_s1.setDisplayOrder(1); helpNodeRepository.save(cat4_s1);
        ContentNode cat4_s2 = new ContentNode(); cat4_s2.setTitle("Thay đổi mật khẩu"); cat4_s2.setSlug("doi-mat-khau"); cat4_s2.setType("ARTICLE"); cat4_s2.setParentId(cat4.getId()); cat4_s2.setDisplayOrder(2); helpNodeRepository.save(cat4_s2);

        ContentNode cat5 = new ContentNode(); cat5.setTitle("Về AiNetsoft"); cat5.setSlug("about-us"); cat5.setType("CATEGORY"); cat5.setDisplayOrder(5); cat5 = helpNodeRepository.save(cat5);
        ContentNode cat5_s1 = new ContentNode(); cat5_s1.setTitle("Giới thiệu doanh nghiệp"); cat5_s1.setSlug("about-us"); cat5_s1.setType("ARTICLE"); cat5_s1.setParentId(cat5.getId()); cat5_s1.setDisplayOrder(1); helpNodeRepository.save(cat5_s1);
        ContentNode cat5_s2 = new ContentNode(); cat5_s2.setTitle("Văn hóa làm việc"); cat5_s2.setSlug("van-hoa-cong-ty"); cat5_s2.setType("ARTICLE"); cat5_s2.setParentId(cat5.getId()); cat5_s2.setDisplayOrder(2); helpNodeRepository.save(cat5_s2);

        ContentNode cat6 = new ContentNode(); cat6.setTitle("Cơ Hội Nghề Nghiệp"); cat6.setSlug("careers"); cat6.setType("CATEGORY"); cat6.setDisplayOrder(6); cat6 = helpNodeRepository.save(cat6);
        ContentNode cat6_s1 = new ContentNode(); cat6_s1.setTitle("Vị trí tuyển dụng"); cat6_s1.setSlug("careers"); cat6_s1.setType("ARTICLE"); cat6_s1.setParentId(cat6.getId()); cat6_s1.setDisplayOrder(1); helpNodeRepository.save(cat6_s1);

        ContentNode cat7 = new ContentNode(); cat7.setTitle("Pháp Lý & Bảo Mật"); cat7.setSlug("legal"); cat7.setType("CATEGORY"); cat7.setDisplayOrder(7); cat7 = helpNodeRepository.save(cat7);
        ContentNode cat7_s1 = new ContentNode(); cat7_s1.setTitle("Điều khoản dịch vụ"); cat7_s1.setSlug("terms"); cat7_s1.setType("ARTICLE"); cat7_s1.setParentId(cat7.getId()); cat7_s1.setDisplayOrder(1); helpNodeRepository.save(cat7_s1);
        ContentNode cat7_s2 = new ContentNode(); cat7_s2.setTitle("Chính sách bảo mật"); cat7_s2.setSlug("privacy"); cat7_s2.setType("ARTICLE"); cat7_s2.setParentId(cat7.getId()); cat7_s2.setDisplayOrder(2); helpNodeRepository.save(cat7_s2);
    }

    private void seedFooterMenus() {
        if (footerMenuRepository.count() > 0) return;
        FooterMenu col1 = new FooterMenu();
        col1.setCategoryTitle("CHĂM SÓC KHÁCH HÀNG"); col1.setDisplayOrder(1);
        col1.setItems(Arrays.asList(
            createMenuItem("Trung Tâm Trợ Giúp", "tai-khoan"),
            createMenuItem("Cách đặt hàng", "mua-sam"),
            createMenuItem("Chính Sách Vận Chuyển", "shipping-policy"),
            createMenuItem("Trả Hàng & Hoàn Tiền", "return-policy")
        ));
        footerMenuRepository.save(col1);

        FooterMenu col2 = new FooterMenu();
        col2.setCategoryTitle("VỀ AINETSOFT"); col2.setDisplayOrder(2);
        col2.setItems(Arrays.asList(
            createMenuItem("Giới Thiệu Về AiNetsoft", "about-us"),
            createMenuItem("Tuyển Dụng", "careers"),
            createMenuItem("Điều Khoản Sử Dụng", "legal"),
            createMenuItem("Chính Sách Bảo Mật", "legal")
        ));
        footerMenuRepository.save(col2);
    }

    private FooterMenu.MenuItem createMenuItem(String label, String url) {
        FooterMenu.MenuItem item = new FooterMenu.MenuItem();
        item.setLabel(label); item.setUrl(url); item.setInternal(true);
        return item;
    }

    private void seedFooterIcons() {
        if (footerIconRepository.count() > 0) return;
        String pBase = localDomain + "/uploads/system/payment_partner/";
        String sBase = localDomain + "/uploads/system/vanchuyen_partner/";
        footerIconRepository.saveAll(Arrays.asList(
            FooterIcon.builder().name("Visa").imgUrl(pBase + "visa.png").category("PAYMENT").displayOrder(1).active(true).build(),
            FooterIcon.builder().name("MoMo").imgUrl(pBase + "momo.png").category("PAYMENT").displayOrder(2).active(true).build(),
            FooterIcon.builder().name("SPX").imgUrl(sBase + "spx.png").category("SHIPPING").displayOrder(1).active(true).build(),
            FooterIcon.builder().name("GHTK").imgUrl(sBase + "ghtk.png").category("SHIPPING").displayOrder(2).active(true).build()
        ));
    }

    private void seedGlobalAdmin() {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                .email(adminEmail).fullName(adminFullName).password(passwordEncoder.encode(adminPassword))
                .roles(new HashSet<>(Arrays.asList("ADMIN", "USER"))).permissions(new HashSet<>(Arrays.asList("ALL_ACCESS")))
                .isGlobalAdmin(true).accountStatus("ACTIVE")
                .emailVerified(true) 
                .enabled(true)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            userRepository.save(admin);
        }
    }

    private List<ShippingMethod> seedShippingMethods() {
        if (shippingMethodRepository.count() > 0) return shippingMethodRepository.findAll();
        ShippingMethod s1 = new ShippingMethod(); s1.setName("Hỏa Tốc"); s1.setBaseCost(208600.0); s1.setActive(true);
        ShippingMethod s2 = new ShippingMethod(); s2.setName("Nhanh"); s2.setBaseCost(28700.0); s2.setActive(true);
        return shippingMethodRepository.saveAll(Arrays.asList(s1, s2));
    }

    private void seedReportReasons() {
        if (reportReasonRepository.count() == 0) {
            String[] reasons = {"Hàng giả", "Phản cảm", "Hàng cấm", "Lừa đảo", "Hình sai", "Khác"};
            for (String r : reasons) {
                ReportReason rr = new ReportReason(); rr.setName(r); rr.setActive(true);
                reportReasonRepository.save(rr);
            }
        }
    }

    private List<Category> seedCategories() {
        if (categoryRepository.count() > 0) return categoryRepository.findAll();
        String[] cats = {"Máy Tính", "Điện Thoại", "Thời Trang", "Gia Dụng", "Sức Khỏe", "Sách", "Đồ Chơi", "Âm Thanh", "Dịch Vụ IT", "TiVi", "Thiết Bị VP", "Ô Tô", "Làm Đẹp", "Văn Phòng", "Tiết Kiệm", "Dịch Vụ VP"};
        List<Category> saved = new ArrayList<>();
        for (String c : cats) {
            Category cat = new Category(); cat.setName(c); cat.setSlug(c.toLowerCase().replace(" ", "-")); cat.setActive(true);
            saved.add(categoryRepository.save(cat));
        }
        return saved;
    }

    private void seedFeedbackTemplates() {
        if (feedbackTemplateRepository.count() == 0) {
            feedbackTemplateRepository.saveAll(Arrays.asList(
                FeedbackTemplate.builder().title("Hồ sơ hợp lệ").content("Chào mừng bạn gia nhập!").type("SELLER_REJECTION").build(),
                FeedbackTemplate.builder().title("CCCD mờ").content("Chụp lại ảnh CCCD.").type("SELLER_REJECTION").build()
            ));
        }
    }

    private void seedDefaultSellers(List<Category> savedCats, List<ShippingMethod> globalMethods) {
        List<User> sellersToSeed = new ArrayList<>();
        
        User official = userRepository.findByEmail("seller@ainetsoft.com").orElse(null);
        if (official == null) {
            sellersToSeed.add(User.builder()
                .email("seller@ainetsoft.com").fullName("AiNetsoft Mall Official").password(passwordEncoder.encode(adminPassword))
                .roles(new HashSet<>(Arrays.asList("SELLER", "USER"))).sellerVerification("VERIFIED").accountStatus("ACTIVE")
                .emailVerified(true) 
                .enabled(true)
                .shopProfile(User.ShopProfile.builder().shopName("AiNetsoft Mall").shopSlug("ainetsoft-mall").build()).build());
        } else {
            if (official.getShopProfile() == null || official.getShopProfile().getShopSlug() == null) {
                official.setShopProfile(User.ShopProfile.builder().shopName("AiNetsoft Mall").shopSlug("ainetsoft-mall").build());
                userRepository.save(official);
            }
        }

        String[] prefixes = {"a", "b", "c"};
        String[] shopNames = {"Hitech Center", "Fashion World", "Smart Home Store"};
        for (int i = 0; i < prefixes.length; i++) {
            String email = "seller_" + prefixes[i] + "@ainetsoft.com";
            User seller = userRepository.findByEmail(email).orElse(null);
            
            if (seller == null) {
                sellersToSeed.add(User.builder()
                    .email(email).fullName(shopNames[i]).password(passwordEncoder.encode(adminPassword))
                    .roles(new HashSet<>(Arrays.asList("SELLER", "USER"))).sellerVerification("VERIFIED").accountStatus("ACTIVE")
                    .emailVerified(true) 
                    .enabled(true)
                    .shopProfile(User.ShopProfile.builder().shopName(shopNames[i]).shopSlug("seller-" + prefixes[i]).build()).build());
            } else {
                if (seller.getShopProfile() == null || seller.getShopProfile().getShopSlug() == null) {
                    seller.setShopProfile(User.ShopProfile.builder().shopName(shopNames[i]).shopSlug("seller-" + prefixes[i]).build());
                    userRepository.save(seller);
                }
            }
        }

        if (!sellersToSeed.isEmpty()) {
            List<User> savedSellers = userRepository.saveAll(sellersToSeed);
            seedMockProducts(savedSellers, savedCats, globalMethods);
        }
    }

    private void seedMockProducts(List<User> sellers, List<Category> savedCats, List<ShippingMethod> globalMethods) {
        if (productRepository.count() > 20 || savedCats.isEmpty()) return;
        Random rand = new Random();
        int prodGlobalCount = 1;

        String professionalDescription = "🌟 SẢN PHẨM CHÍNH HÃNG CAO CẤP\n\n" +
                "🔹 Thiết kế hiện đại, sang trọng và tinh tế.\n" +
                "🔹 Chất liệu cao cấp, độ bền bỉ vượt trội theo thời gian.\n" +
                "🔹 Tính năng thông minh, đáp ứng hoàn hảo nhu cầu sử dụng hàng ngày.\n" +
                "🔹 Đóng gói cẩn thận, giao hàng hỏa tốc an toàn.\n\n" +
                "🛡️ CAM KẾT TỪ SHOP:\n" +
                "- Bảo hành chính hãng uy tín 12 tháng.\n" +
                "- Đổi trả miễn phí trong 7 ngày nếu có lỗi từ nhà sản xuất.\n" +
                "- Hỗ trợ tư vấn nhiệt tình 24/7.\n\n" +
                "Sở hữu ngay hôm nay để nhận những ưu đãi hấp dẫn nhất từ AiNetsoft Mall!";

        for (User seller : sellers) {
            String slug = seller.getShopProfile().getShopSlug();
            String shopName = seller.getShopProfile().getShopName();
            
            for (int i = 1; i <= 15; i++) {
                Category cat = savedCats.get(rand.nextInt(savedCats.size()));
                Product p = Product.builder()
                        .name(cat.getName() + " Elite Gen " + (prodGlobalCount++))
                        .description(professionalDescription)
                        .price(100000.0 + (rand.nextInt(500) * 1000)).stock(50)
                        .categoryId(cat.getId()).categoryName(cat.getName())
                        .sellerId(seller.getId())
                        .shopName(shopName)
                        .sellerSlug(slug) 
                        .status("APPROVED")
                        .imageUrls(Arrays.asList("https://picsum.photos/seed/" + (prodGlobalCount) + "/600/600"))
                        .build();
                productRepository.save(p);
            }
        }
    }

    private void seedSubAdmin() {
        if (!userRepository.existsByEmail("mod@ainetsoft.com")) {
            User m = new User(); m.setEmail("mod@ainetsoft.com"); m.setFullName("Moderator Team");
            m.setPassword(passwordEncoder.encode(adminPassword)); m.setRoles(new HashSet<>(Arrays.asList("ADMIN")));
            m.setAccountStatus("ACTIVE"); 
            m.setEmailVerified(true); 
            m.setEnabled(true);
            userRepository.save(m);
        }
    }

    private void seedRegularUsers() {
        if (!userRepository.existsByEmail("user@ainetsoft.com")) {
            User u = new User(); u.setEmail("user@ainetsoft.com"); u.setFullName("Test Consumer");
            u.setPassword(passwordEncoder.encode(adminPassword)); u.setRoles(new HashSet<>(Arrays.asList("USER")));
            u.setAccountStatus("ACTIVE"); 
            u.setEmailVerified(true); 
            u.setEnabled(true);
            
            User.AddressInfo defaultAddress = User.AddressInfo.builder()
                .receiverName("Test Consumer")
                .phone("084123456789")
                .province("Hồ Chí Minh")
                .ward("Quận 12")
                .detail("A2.804 Chung cư Hưng Ngân, Phường Tân Chánh Hiệp")
                .isDefault(true)
                .build();
            u.setAddresses(new ArrayList<>(Arrays.asList(defaultAddress)));
            
            userRepository.save(u);
        }
        
        // 🚀 THÊM USER MỚI: NOBANK CONSUMER (KHÔNG TẠO BANK ACCOUNT CHO USER NÀY)
        if (!userRepository.existsByEmail("nobank@ainetsoft.com")) {
            User u2 = new User(); u2.setEmail("nobank@ainetsoft.com"); u2.setFullName("NoBank Consumer");
            u2.setPassword(passwordEncoder.encode(adminPassword)); u2.setRoles(new HashSet<>(Arrays.asList("USER")));
            u2.setAccountStatus("ACTIVE"); 
            u2.setEmailVerified(true); 
            u2.setEnabled(true);
            
            // 🚀 BỔ SUNG ĐỊA CHỈ GIAO HÀNG CHO NOBANK CONSUMER
            User.AddressInfo nobankAddress = User.AddressInfo.builder()
                .receiverName("NoBank Consumer")
                .phone("0999888777")
                .province("Hà Nội")
                .ward("Quận Cầu Giấy")
                .detail("Số 1 Phạm Văn Đồng, Phường Mai Dịch")
                .isDefault(true)
                .build();
            u2.setAddresses(new ArrayList<>(Arrays.asList(nobankAddress)));
            
            userRepository.save(u2);
        }
    }

    private void seedPendingModeration(List<Category> savedCats, List<ShippingMethod> globalMethods) {
        if (!userRepository.existsByEmail("pending@ainetsoft.com")) {
            User p = new User(); p.setEmail("pending@ainetsoft.com"); p.setFullName("Pending Merchant");
            p.setPassword(passwordEncoder.encode(adminPassword)); p.setRoles(new HashSet<>(Arrays.asList("USER")));
            p.setAccountStatus("PENDING_SELLER"); 
            p.setEmailVerified(true); 
            p.setEnabled(true);
            userRepository.save(p);
        }
    }

    private void seedBankAccounts() {
        User sellerA = userRepository.findByEmail("seller_a@ainetsoft.com").orElse(null);
        User buyer = userRepository.findByEmail("user@ainetsoft.com").orElse(null);

        if (sellerA != null && !bankAccountRepository.existsByUserId(sellerA.getId())) {
            BankAccount bankSeller = BankAccount.builder().userId(sellerA.getId()).bankName("ACB").accountNumber("0322222222")
                    .accountHolder("CAC THI CHO").isDefault(true).createdAt(LocalDateTime.now()).build();
            bankAccountRepository.save(bankSeller);
        }

        if (buyer != null && !bankAccountRepository.existsByUserId(buyer.getId())) {
            BankAccount bankBuyer = BankAccount.builder().userId(buyer.getId()).bankName("Vietcombank").accountNumber("0123456789")
                    .accountHolder("TEST CONSUMER").isDefault(true).createdAt(LocalDateTime.now()).build();
            bankAccountRepository.save(bankBuyer);
        }
        
        // LƯU Ý: Tuyệt đối không gọi lệnh tạo BankAccount cho nobank@ainetsoft.com ở đây!
    }

   private void seedWithdrawalTestData() {
        User sellerA = userRepository.findByEmail("seller_a@ainetsoft.com").orElse(null);
        User buyer = userRepository.findByEmail("user@ainetsoft.com").orElse(null);
        
        // 1. CHỈ KIỂM TRA LỊCH SỬ CỦA SELLER A (Nếu chưa có thì tạo)
        if (sellerA != null && withdrawalRepository.countBySellerId(sellerA.getId()) == 0) {
            Product validProduct = productRepository.findAll().stream()
                    .filter(p -> p.getSellerId().equals(sellerA.getId()))
                    .findFirst().orElse(null);
            String safeProductId = validProduct != null ? validProduct.getId() : "69ee23e7841d823d3e14e424";

            User.AddressInfo dummyAddress = User.AddressInfo.builder()
                .receiverName("Test Address")
                .phone("0987654321")
                .province("Hồ Chí Minh")
                .ward("Quận 12")
                .detail("A2.804 Chung cư Hưng Ngân")
                .isDefault(true)
                .build();

            // 🚀 ĐÃ SỬA: Tăng giá trị đơn hàng lên 2.500.000đ để Seller A có dư tiền rút 1 triệu
            Order order1 = Order.builder()
                .userId(buyer != null ? buyer.getId() : "dummyUserId")
                .status("COMPLETED")
                .totalAmount(2500000.0) 
                .finalTotalAmount(2500000.0)
                .paymentMethod("COD")
                .shippingAddress(dummyAddress)
                .trackingCode("GHN-SEED-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .shippingProvider("Giao Hàng Nhanh")
                .carrierStatus("DELIVERED")
                .items(Arrays.asList(OrderItem.builder().productId(safeProductId).sellerId(sellerA.getId()).shopName(sellerA.getShopProfile().getShopName()).productName("Bàn phím cơ Test").imageUrl("https://picsum.photos/200").price(2500000.0).quantity(1).build()))
                .createdAt(LocalDateTime.now().minusDays(3))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build();

            Order order2 = Order.builder()
                .userId(buyer != null ? buyer.getId() : "dummyUserId")
                .status("SHIPPING")
                .totalAmount(150000.0)
                .finalTotalAmount(150000.0)
                .paymentMethod("COD")
                .shippingAddress(dummyAddress)
                .trackingCode("GHN-SEED-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .shippingProvider("Giao Hàng Nhanh")
                .carrierStatus("IN_TRANSIT")
                .items(Arrays.asList(OrderItem.builder().productId(safeProductId).sellerId(sellerA.getId()).shopName(sellerA.getShopProfile().getShopName()).productName("Chuột không dây Test").imageUrl("https://picsum.photos/200").price(150000.0).quantity(1).build()))
                .createdAt(LocalDateTime.now().minusDays(1))
                .updatedAt(LocalDateTime.now())
                .build();

            orderRepository.saveAll(Arrays.asList(order1, order2));

            // 🚀 ĐÃ SỬA: Đổi cả 2 lệnh cũ thành COMPLETED để giải phóng "hasPending" cho Seller A
            WithdrawalRequest oldReq = WithdrawalRequest.builder()
                    .targetType("SELLER")
                    .sellerId(sellerA.getId()).shopName(sellerA.getShopProfile().getShopName())
                    .sellerFullName(sellerA.getFullName()).amount(100000.0).status("COMPLETED")
                    .bankName("ACB").accountNumber("0322222222").accountHolder("CAC THI CHO")
                    .fee(4300.0).netAmount(95700.0) // Chèn thêm fee ảo cho file cũ
                    .createdAt(LocalDateTime.now().minusDays(10)).processedAt(LocalDateTime.now().minusDays(9))
                    .build();

            WithdrawalRequest oldReq2 = WithdrawalRequest.builder()
                    .targetType("SELLER")
                    .sellerId(sellerA.getId()).shopName(sellerA.getShopProfile().getShopName())
                    .sellerFullName(sellerA.getFullName()).amount(50000.0).status("COMPLETED")
                    .bankName("ACB").accountNumber("0322222222").accountHolder("CAC THI CHO")
                    .fee(3800.0).netAmount(46200.0) // Chèn thêm fee ảo cho file cũ
                    .createdAt(LocalDateTime.now().minusDays(2)).processedAt(LocalDateTime.now().minusDays(1))
                    .build();
                    
            withdrawalRepository.saveAll(Arrays.asList(oldReq, oldReq2));
        }

        // 2. CHỈ KIỂM TRA LỊCH SỬ CỦA BUYER (Tách biệt hoàn toàn với Seller)
        if (buyer != null && withdrawalRepository.findByUserIdOrderByCreatedAtDesc(buyer.getId()).isEmpty()) {
            WithdrawalRequest buyerReq = WithdrawalRequest.builder()
                    .targetType("BUYER")
                    .userId(buyer.getId())
                    .shopName(buyer.getFullName()) 
                    .sellerFullName(buyer.getFullName())
                    .amount(150000.0)
                    .fee(4800.0).netAmount(145200.0)
                    .status("COMPLETED")
                    .bankName("Vietcombank")
                    .accountNumber("0123456789")
                    .accountHolder("TEST CONSUMER")
                    .createdAt(LocalDateTime.now().minusDays(2))
                    .processedAt(LocalDateTime.now().minusDays(1))
                    .build();

            withdrawalRepository.save(buyerReq);
        }
    }
}
