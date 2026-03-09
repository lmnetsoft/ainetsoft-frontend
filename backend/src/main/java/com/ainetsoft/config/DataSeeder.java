package com.ainetsoft.config;

import com.ainetsoft.model.*;
import com.ainetsoft.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) return; 

        String commonPassword = passwordEncoder.encode("Test1234!");

        // 1. CORE USERS
        User admin = User.builder()
                .email("admin@ainetsoft.com").fullName("System Admin")
                .password(commonPassword).roles(new HashSet<>(Set.of("ADMIN", "USER")))
                .accountStatus("ACTIVE").build();

        User seller = User.builder()
                .email("seller@ainetsoft.com").fullName("Tech Universe Store")
                .password(commonPassword).roles(new HashSet<>(Set.of("SELLER", "USER")))
                .sellerVerification("VERIFIED").build();

        User buyer = User.builder()
                .email("buyer@ainetsoft.com").fullName("Nguyen Van A")
                .password(commonPassword).roles(new HashSet<>(Set.of("USER")))
                .accountStatus("ACTIVE").build();

        // 2. MODERATION TEST CASES
        User bannedUser = User.builder()
                .email("scammer@badsite.com").fullName("Malicious Actor")
                .password(commonPassword).roles(new HashSet<>(Set.of("USER")))
                .accountStatus("BANNED").build();

        User pendingSeller = User.builder()
                .email("newbie@shop.com").fullName("Future Entrepreneur")
                .password(commonPassword).roles(new HashSet<>(Set.of("USER")))
                .sellerVerification("PENDING").build();

        userRepository.saveAll(Arrays.asList(admin, seller, buyer, bannedUser, pendingSeller));

        // 3. PRODUCT TEST CASES
        Product approvedProd = Product.builder()
                .name("iPhone 15 Pro Max").price(32000000).stock(10)
                .sellerId(seller.getId()).status("APPROVED")
                .averageRating(4.8).reviewCount(15).build();

        Product rejectedProd = Product.builder()
                .name("Fake Designer Bag").price(500000).stock(1)
                .sellerId(seller.getId()).status("REJECTED").build();

        Product pendingProd = Product.builder()
                .name("Sony WH-1000XM5").price(8500000).stock(20)
                .sellerId(seller.getId()).status("PENDING").build();

        productRepository.saveAll(Arrays.asList(approvedProd, rejectedProd, pendingProd));

        // 4. ORDER TEST CASES
        Order completedOrder = Order.builder()
                .userId(buyer.getId()).sellerId(seller.getId())
                .totalAmount(32000000).status("COMPLETED").reviewed(true)
                .createdAt(LocalDateTime.now().minusDays(5)).build();

        Order cancelledOrder = Order.builder()
                .userId(buyer.getId()).sellerId(seller.getId())
                .totalAmount(8500000).status("CANCELLED")
                .createdAt(LocalDateTime.now().minusDays(10)).build();

        orderRepository.saveAll(Arrays.asList(completedOrder, cancelledOrder));

        System.out.println("✅ Complex Mock Data Seeded for Marketplace Stress Testing!");
    }
}