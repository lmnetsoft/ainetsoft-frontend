package com.ainetsoft.service;

import com.ainetsoft.model.*;
import com.ainetsoft.repository.OrderRepository;
import com.ainetsoft.repository.ProductRepository;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * OrderService manages the lifecycle of customer orders, including
 * stock management and cart synchronization.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    /**
     * Converts User's Cart into a real Order, updates stock, and clears cart.
     * Uses the simplified AddressInfo (No District).
     */
    @Transactional
    public Order placeOrder(String contactInfo, String paymentMethod) {
        // 1. Fetch User and their Cart
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (user.getCart() == null || user.getCart().isEmpty()) {
            throw new RuntimeException("Giỏ hàng của bạn đang trống!");
        }

        // 2. Map CartItems to OrderItems and Calculate Total
        double totalAmount = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : user.getCart()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm " + cartItem.getProductName() + " không còn tồn tại!"));

            // Inventory Check
            if (product.getStock() < cartItem.getQuantity()) {
                throw new RuntimeException("Sản phẩm " + product.getName() + " không đủ số lượng trong kho!");
            }

            // Reduce Stock and Persist
            product.setStock(product.getStock() - cartItem.getQuantity());
            product.setUpdatedAt(LocalDateTime.now());
            productRepository.save(product);

            // Create Order Item
            orderItems.add(OrderItem.builder()
                    .productId(cartItem.getProductId())
                    .productName(cartItem.getProductName())
                    .quantity(cartItem.getQuantity())
                    .price(cartItem.getPrice())
                    .imageUrl(cartItem.getProductImage()) 
                    .shopName(cartItem.getShopName())
                    .build());

            totalAmount += (cartItem.getPrice() * cartItem.getQuantity());
        }

        // 3. Find Shipping Address (Now using standardized AddressInfo)
        if (user.getAddresses() == null || user.getAddresses().isEmpty()) {
             throw new RuntimeException("Vui lòng thêm địa chỉ nhận hàng trong hồ sơ!");
        }

        // Standardized Address Retrieval: Prioritize default
        User.AddressInfo shippingAddr = user.getAddresses().stream()
                .filter(User.AddressInfo::isDefault)
                .findFirst()
                .orElse(user.getAddresses().get(0));

        // 4. Create the Order
        Order newOrder = Order.builder()
                .userId(user.getId())
                .items(orderItems)
                .totalAmount(totalAmount)
                .shippingAddress(shippingAddr) // Embeds simplified address (No District)
                .paymentMethod(paymentMethod)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(newOrder);

        // 5. Clear user cart and persist
        user.setCart(new ArrayList<>());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Order placed successfully for user {}. Order ID: {}", user.getId(), savedOrder.getId());
        return savedOrder;
    }

    /**
     * Retrieves orders for a specific user, filtered by status.
     */
    public List<Order> getUserOrders(String contactInfo, String status) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if (status == null || status.equalsIgnoreCase("ALL") || status.isBlank()) {
            return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }

        return orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status.toUpperCase());
    }

    /**
     * Seller-specific view: Filters orders containing products from their shop.
     */
    public List<Order> getOrdersForSeller(String shopName) {
        return orderRepository.findAll().stream()
                .filter(order -> order.getItems().stream()
                        .anyMatch(item -> item.getShopName().equalsIgnoreCase(shopName)))
                .collect(Collectors.toList());
    }
}