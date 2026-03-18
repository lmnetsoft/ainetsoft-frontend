package com.ainetsoft.config;

import com.ainetsoft.model.*;
import com.ainetsoft.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ShippingMethodRepository shippingMethodRepository;
    private final ReviewRepository reviewRepository; // NEW: Added dependency
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.mock-data:true}")
    private boolean seedMockData;

    @Value("${admin.setup.email:admin@ainetsoft.com}")
    private String adminEmail;

    @Value("${admin.setup.password:Test1234!}")
    private String adminPassword;

    @Value("${admin.setup.fullname:System Admin}")
    private String adminFullName;

    @Override
    public void run(String... args) throws Exception {
        // 1. Core Security: System Admin
        seedGlobalAdmin();

        // 2. Global Logistics: Shipping Templates
        List<ShippingMethod> globalMethods = seedShippingMethods();

        // 3. Mock Ecosystem for Development
        if (seedMockData) {
            System.out.println("🛠 Seeding Full Mock Ecosystem with Audits...");
            List<Category> savedCats = seedCategories();
            seedDefaultSeller(savedCats, globalMethods);
            seedPendingModeration(savedCats);
            seedSubAdmin();
        }
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
            System.out.println("🚀 Global Admin born: " + adminEmail);
        }
    }

    private List<ShippingMethod> seedShippingMethods() {
        if (shippingMethodRepository.count() > 0) return shippingMethodRepository.findAll();

        List<ShippingMethod> methods = Arrays.asList(
            ShippingMethod.builder()
                .name("Hỏa Tốc")
                .description("Nhận hàng trong 2 giờ")
                .baseCost(208600.0)
                .estimatedTime("Ngày mai 08:00")
                .isActive(true)
                .build(),
            ShippingMethod.builder()
                .name("Nhanh")
                .description("Giao hàng tiêu chuẩn")
                .baseCost(28700.0)
                .estimatedTime("19 Th03 - 20 Th03")
                .isActive(true)
                .build(),
            ShippingMethod.builder()
                .name("Hàng Cồng Kềnh")
                .description("Dành cho sản phẩm lớn")
                .baseCost(28700.0)
                .estimatedTime("19 Th03 - 23 Th03")
                .isActive(true)
                .build()
        );

        System.out.println("🚚 Global Shipping Templates Seeded.");
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
                    .name(name)
                    .slug(name.toLowerCase().replace(" ", "-"))
                    .active(true)
                    .build();
            savedCats.add(categoryRepository.save(c));
        }
        System.out.println("✅ 18 Categories Seeded.");
        return savedCats;
    }

    private void seedDefaultSeller(List<Category> savedCats, List<ShippingMethod> globalMethods) {
        String sellerEmail = "seller@ainetsoft.com";
        if (!userRepository.existsByEmail(sellerEmail)) {
            User seller = User.builder()
                    .email(sellerEmail)
                    .fullName("AiNetsoft Mall")
                    .password(passwordEncoder.encode("Test1234!"))
                    .roles(new HashSet<>(Set.of("SELLER", "USER")))
                    .sellerVerification("VERIFIED")
                    .accountStatus("ACTIVE")
                    .build();
            userRepository.save(seller);
            System.out.println("✅ Default Seller 'AiNetsoft Mall' Created.");
            seedMockProducts(seller, savedCats, globalMethods);
        }
    }

    private void seedMockProducts(User seller, List<Category> savedCats, List<ShippingMethod> globalMethods) {
        if (productRepository.count() > 10 || savedCats.isEmpty()) return;

        List<Product> productsToSave = new ArrayList<>();
        Random rand = new Random();

        for (int i = 1; i <= 55; i++) {
            Category randomCat = savedCats.get(rand.nextInt(savedCats.size()));
            List<Product.ShippingConfig> situationalOptions = new ArrayList<>();
            
            situationalOptions.add(Product.ShippingConfig.builder()
                    .methodId(globalMethods.get(1).getId())
                    .methodName(globalMethods.get(1).getName())
                    .cost(28700.0)
                    .estimatedTime("19 Th03 - 20 Th03")
                    .voucherNote("Tặng Voucher 15.000đ nếu đơn giao sau thời gian trên.")
                    .build());
            
            if (i % 3 == 0) {
                situationalOptions.add(Product.ShippingConfig.builder()
                        .methodId(globalMethods.get(0).getId())
                        .methodName(globalMethods.get(0).getName())
                        .cost(208600.0)
                        .estimatedTime("Ngày mai 08:00")
                        .voucherNote("Tặng Voucher 20.000đ nếu đơn giao sau thời gian trên.")
                        .build());
            }

            Product p = Product.builder()
                    .name(randomCat.getName() + " Elite Gen " + i)
                    .description("Sản phẩm chuyên nghiệp được phân phối bởi " + seller.getFullName())
                    .price(100000 + (rand.nextInt(500) * 1000))
                    .stock(rand.nextInt(100) + 10)
                    .categoryId(randomCat.getId())
                    .categoryName(randomCat.getName())
                    .sellerId(seller.getId())
                    .shopName(seller.getFullName())
                    .status("APPROVED")
                    .imageUrls(Arrays.asList("https://picsum.photos/seed/" + i + "/600/600"))
                    .videoUrl(i % 5 == 0 ? "https://www.w3schools.com/html/mov_bbb.mp4" : null)
                    .shippingOptions(situationalOptions)
                    .protectionEnabled(true)
                    .allowSharing(true)
                    .favoriteCount(rand.nextInt(100))
                    .soldCount(rand.nextInt(500) + 10) // NEW: Social proof
                    .averageRating(4.0 + (rand.nextDouble() * 1.0))
                    .reviewCount(3) // Initial seed count
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            
            Product saved = productRepository.save(p);
            seedMockReviews(saved, seller.getId()); // NEW: Attach reviews to each product
        }
        System.out.println("✅ 55 Professional Mock Products with Reviews Seeded.");
    }

    private void seedMockReviews(Product product, String sellerId) {
        // 1. High Rating with Image and Seller Reply
        reviewRepository.save(Review.builder()
                .productId(product.getId())
                .sellerId(sellerId)
                .userName("tatoanhduc07")
                .rating(5)
                .comment("Sản phẩm tuyệt vời! Đúng với mô tả: như hình. Chất lượng tuyệt vời.")
                .variantInfo("Phân loại hàng: Size M (53-55cm)")
                .imageUrls(Arrays.asList("https://picsum.photos/seed/rev" + product.getId() + "/400/400"))
                .isVerifiedPurchase(true)
                .sellerReply("Cảm ơn Quý khách đã tin tưởng lựa chọn sản phẩm chính hãng!")
                .repliedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now().minusDays(1))
                .build());

        // 2. Mid Rating
        reviewRepository.save(Review.builder()
                .productId(product.getId())
                .sellerId(sellerId)
                .userName("lien0988324688")
                .rating(4)
                .comment("Giao hàng nhanh, giá rẻ, chất lượng tốt và hàng đẹp.")
                .variantInfo("Phân loại hàng: Mặc định")
                .isVerifiedPurchase(true)
                .createdAt(LocalDateTime.now().minusDays(3))
                .build());
    }

    private void seedSubAdmin() {
        String modEmail = "mod@ainetsoft.com";
        if (!userRepository.existsByEmail(modEmail)) {
            User mod = User.builder()
                    .email(modEmail)
                    .fullName("Product Moderator")
                    .password(passwordEncoder.encode("Test1234!"))
                    .roles(new HashSet<>(Set.of("ADMIN")))
                    .permissions(new HashSet<>(Set.of("MANAGE_PRODUCTS"))) 
                    .accountStatus("ACTIVE")
                    .build();
            userRepository.save(mod);
            System.out.println("🛡 Sub-Admin (Moderator) created.");
        }
    }

    private void seedPendingModeration(List<Category> savedCats) {
        String pendingSellerEmail = "pending_seller@example.com";
        if (!userRepository.existsByEmail(pendingSellerEmail)) {
            User pSeller = User.builder()
                    .email(pendingSellerEmail)
                    .fullName("Nguyễn Văn Chờ Duyệt")
                    .phone("0987654321")
                    .password(passwordEncoder.encode("Test1234!"))
                    .roles(new HashSet<>(Set.of("USER")))
                    .accountStatus("PENDING_SELLER")
                    .sellerVerification("PENDING")
                    .identityInfo(User.IdentityInfo.builder()
                            .cccdNumber("012345678912")
                            .frontImageUrl("https://picsum.photos/seed/front/400/250")
                            .backImageUrl("https://picsum.photos/seed/back/400/250")
                            .submittedAt(LocalDateTime.now())
                            .build())
                    .shopProfile(User.ShopProfile.builder()
                            .shopName("Shop Đang Đợi Duyệt")
                            .shopAddress("789 Lạc Long Quân, Tân Bình, TP.HCM")
                            .build())
                    .bankAccounts(Collections.singletonList(User.BankInfo.builder()
                            .bankName("Vietcombank")
                            .accountNumber("9988776655")
                            .accountHolder("NGUYEN VAN CHO DUYET")
                            .isDefault(true)
                            .build()))
                    .build();
            userRepository.save(pSeller);

            if (!savedCats.isEmpty()) {
                Category cat = savedCats.get(0);
                Product p = Product.builder()
                        .name("Bản mẫu sản phẩm đang đợi duyệt")
                        .description("Sản phẩm demo cho quy trình kiểm duyệt Admin.")
                        .price(1500000.0)
                        .stock(5)
                        .categoryId(cat.getId())
                        .categoryName(cat.getName())
                        .sellerId(pSeller.getId())
                        .shopName(pSeller.getShopProfile().getShopName())
                        .status("PENDING")
                        .imageUrls(Arrays.asList("https://picsum.photos/600/600"))
                        .protectionEnabled(true)
                        .createdAt(LocalDateTime.now())
                        .build();
                productRepository.save(p);
            }
            System.out.println("⚠️ Full Pending Data Seeded for Admin Testing.");
        }
    }
}