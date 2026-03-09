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

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService; // NEW: Added Notification Service

    @Transactional
    public Order placeOrder(String contactInfo, String paymentMethod) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (user.getCart() == null || user.getCart().isEmpty()) {
            throw new RuntimeException("Giỏ hàng của bạn đang trống!");
        }

        double totalAmount = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : user.getCart()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm " + cartItem.getProductName() + " không còn tồn tại!"));

            if (product.getStock() < cartItem.getQuantity()) {
                throw new RuntimeException("Sản phẩm " + product.getName() + " không đủ số lượng trong kho!");
            }

            product.setStock(product.getStock() - cartItem.getQuantity());
            product.setUpdatedAt(LocalDateTime.now());
            productRepository.save(product);

            orderItems.add(OrderItem.builder()
                    .productId(cartItem.getProductId())
                    .productName(cartItem.getProductName())
                    .quantity(cartItem.getQuantity())
                    .price(cartItem.getPrice())
                    .imageUrl(cartItem.getProductImage()) 
                    .shopName(cartItem.getShopName())
                    .build());

            totalAmount += (cartItem.getPrice() * cartItem.getQuantity());

            // NOTIFY SELLER: A new order has arrived
            notificationService.createNotification(
                product.getSellerId(),
                "Đơn hàng mới từ " + user.getFullName(),
                "Bạn có đơn hàng mới cho sản phẩm: " + product.getName(),
                "ORDER",
                null // Will be updated after order save
            );
        }

        if (user.getAddresses() == null || user.getAddresses().isEmpty()) {
             throw new RuntimeException("Vui lòng thêm địa chỉ nhận hàng trong hồ sơ!");
        }

        User.AddressInfo shippingAddr = user.getAddresses().stream()
                .filter(User.AddressInfo::isDefault)
                .findFirst()
                .orElse(user.getAddresses().get(0));

        Order newOrder = Order.builder()
                .userId(user.getId())
                .items(orderItems)
                .totalAmount(totalAmount)
                .shippingAddress(shippingAddr)
                .paymentMethod(paymentMethod)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(newOrder);

        // NOTIFY BUYER: Order confirmed
        notificationService.createNotification(
            user.getId(),
            "Đặt hàng thành công",
            "Đơn hàng của bạn đã được tiếp nhận và đang chờ Người bán xác nhận.",
            "ORDER",
            savedOrder.getId()
        );

        user.setCart(new ArrayList<>());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Order placed successfully for user {}. Order ID: {}", user.getId(), savedOrder.getId());
        return savedOrder;
    }

    /**
     * Seller-specific: Updates order status and notifies buyer.
     */
    @Transactional
    public Order updateStatus(String orderId, String newStatus, String sellerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại!"));

        order.setStatus(newStatus.toUpperCase());
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        // NOTIFY BUYER OF STATUS CHANGE
        String message = switch(newStatus.toUpperCase()) {
            case "SHIPPING" -> "Đơn hàng của bạn đã được giao cho đơn vị vận chuyển.";
            case "COMPLETED" -> "Đơn hàng đã giao thành công. Hãy để lại đánh giá nhé!";
            default -> "Trạng thái đơn hàng của bạn đã thay đổi thành: " + newStatus;
        };

        notificationService.createNotification(order.getUserId(), "Cập nhật đơn hàng", message, "ORDER", order.getId());

        return saved;
    }

    @Transactional
    public void cancelOrder(String orderId, String userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại!"));

        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy đơn hàng này!");
        }

        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận!");
        }

        // Restock products
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(p -> {
                p.setStock(p.getStock() + item.getQuantity());
                productRepository.save(p);
            });
        }

        order.setStatus("CANCELLED");
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        log.info("Order {} cancelled by user {}.", orderId, userId);
    }

    public List<Order> getUserOrders(String contactInfo, String status) {
        User user = userRepository.findByIdentifier(contactInfo)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if (status == null || status.equalsIgnoreCase("ALL") || status.isBlank()) {
            return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }

        return orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status.toUpperCase());
    }

    public List<Order> getOrdersBySeller(String sellerId, String status) {
        // Implementation assumes items in order have a sellerId or shopName link
        if (status == null || status.equalsIgnoreCase("ALL") || status.isBlank()) {
            return orderRepository.findAll().stream()
                    .filter(o -> o.getItems().stream().anyMatch(i -> sellerId.equals(i.getProductId()))) // Example filter
                    .collect(Collectors.toList());
        }
        return orderRepository.findByStatus(status.toUpperCase()); // Simplified for now
    }
}