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
    private final OrderRepository orderRepository;
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
        seedGlobalAdmin();

        if (seedMockData) {
            System.out.println("🛠 Seeding Mock Data for Development Mode...");
            List<Category> savedCats = seedCategories();
            seedDefaultSeller(savedCats);
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
            System.out.println("🛡 Sub-Admin created: " + modEmail);
        }
    }

    private void seedPendingModeration(List<Category> savedCats) {
        String pendingSellerEmail = "pending_seller@example.com";
        
        if (!userRepository.existsByEmail(pendingSellerEmail)) {
            // NEW: Seeding the ID and Bank data we need for the new Admin UI
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
                            .shopName("Shop Chờ Duyệt")
                            .shopAddress("456 Đường CMT8, Quận 3, TP.HCM")
                            .build())
                    .bankAccounts(Collections.singletonList(User.BankInfo.builder()
                            .bankName("VietinBank")
                            .accountNumber("1122334455")
                            .accountHolder("NGUYEN VAN CHO DUYET")
                            .isDefault(true)
                            .build()))
                    .build();
            userRepository.save(pSeller);

            if (!savedCats.isEmpty()) {
                Category cat = savedCats.get(0);
                Product p = Product.builder()
                        .name("Sản phẩm Chờ Duyệt " + cat.getName())
                        .description("Đây là mô tả của sản phẩm đang đợi admin phê duyệt.")
                        .price(999000.0)
                        .stock(10)
                        .categoryId(cat.getId())
                        .categoryName(cat.getName())
                        .sellerId(pSeller.getId())
                        .shopName("Shop Chờ Duyệt")
                        .status("PENDING")
                        .imageUrls(Arrays.asList("https://picsum.photos/600/600"))
                        .createdAt(LocalDateTime.now())
                        .build();
                productRepository.save(p);
            }
            System.out.println("⚠️ Pending items seeded for Admin Testing.");
        }
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
        System.out.println("✅ Categories Seeded.");
        return savedCats;
    }

    private void seedDefaultSeller(List<Category> savedCats) {
        String sellerEmail = "seller@ainetsoft.com";
        String commonPassword = passwordEncoder.encode("Test1234!");

        if (!userRepository.existsByEmail(sellerEmail)) {
            User seller = User.builder()
                    .email(sellerEmail)
                    .fullName("AiNetsoft Mall")
                    .password(commonPassword)
                    .roles(new HashSet<>(Set.of("SELLER", "USER")))
                    .sellerVerification("VERIFIED")
                    .accountStatus("ACTIVE")
                    .build();
            userRepository.save(seller);
            System.out.println("✅ Default Seller created.");
            seedMockProducts(seller, savedCats);
        }
    }

    private void seedMockProducts(User seller, List<Category> savedCats) {
        if (productRepository.count() > 10 || savedCats.isEmpty()) return;

        List<Product> products = new ArrayList<>();
        Random rand = new Random();

        // RESTORED: Full original 55 mock products logic
        for (int i = 1; i <= 55; i++) {
            Category randomCat = savedCats.get(rand.nextInt(savedCats.size()));
            
            Map<String, String> specs = new HashMap<>();
            specs.put("Thương hiệu", "AiNetsoft");
            specs.put("Xuất xứ", "Việt Nam");
            specs.put("Bảo hành", "12 tháng");

            Product p = Product.builder()
                    .name(randomCat.getName() + " Thế Hệ Mới " + i)
                    .description("Sản phẩm cao cấp thuộc danh mục " + randomCat.getName())
                    .price(100000 + (rand.nextInt(500) * 1000))
                    .stock(rand.nextInt(100) + 5)
                    .categoryId(randomCat.getId())
                    .categoryName(randomCat.getName())
                    .sellerId(seller.getId())
                    .shopName(seller.getFullName())
                    .specifications(specs)
                    .status("APPROVED")
                    .imageUrls(Arrays.asList("https://picsum.photos/seed/" + i + "/600/600"))
                    .videoUrl(i % 5 == 0 ? "https://www.w3schools.com/html/mov_bbb.mp4" : null)
                    .averageRating(4.0 + (rand.nextDouble() * 1.0))
                    .reviewCount(rand.nextInt(30))
                    .createdAt(LocalDateTime.now())
                    .build();
            products.add(p);
        }
        productRepository.saveAll(products);
        System.out.println("✅ 55 Mock Products seeded.");
    }
}