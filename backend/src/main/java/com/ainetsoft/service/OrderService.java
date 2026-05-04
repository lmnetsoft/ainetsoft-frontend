package com.ainetsoft.service;

import com.ainetsoft.model.*;
import com.ainetsoft.repository.BankAccountRepository; 
import com.ainetsoft.repository.OrderRepository;
import com.ainetsoft.repository.ProductRepository;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.VoucherRepository; 
import com.ainetsoft.repository.WalletRepository;   
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;
    private final BankAccountRepository bankAccountRepository; 
    private final VoucherRepository voucherRepository; 
    private final WalletRepository walletRepository;   

    public Map<String, Object> getSellerStats(String sellerId) {
        List<Order> allOrders = orderRepository.findAll();
        
        List<Order> sellerOrders = allOrders.stream()
                .filter(o -> o.getItems().stream().anyMatch(i -> sellerId.equals(i.getSellerId())))
                .collect(Collectors.toList());

        long totalOrders = sellerOrders.size();
        
        double totalRevenue = sellerOrders.stream()
                .filter(o -> "COMPLETED".equals(o.getStatus()))
                .flatMap(o -> o.getItems().stream())
                .filter(i -> sellerId.equals(i.getSellerId()))
                .mapToDouble(i -> i.getPrice() * i.getQuantity())
                .sum();

        long pendingOrders = sellerOrders.stream()
                .filter(o -> "PENDING".equals(o.getStatus()))
                .count();

        boolean hasBankAccount = !bankAccountRepository.findByUserId(sellerId).isEmpty();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("pendingOrders", pendingOrders);
        stats.put("isWithdrawalReady", hasBankAccount); 
        return stats;
    }

    @Transactional
    public Order createOrder(Order orderRequest) {
        User user = userRepository.findById(orderRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (user.getCart() == null || user.getCart().isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống!");
        }

        double baseTotalAmount = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : user.getCart()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại!"));

            if (product.getStock() < cartItem.getQuantity()) {
                throw new RuntimeException("Sản phẩm " + product.getName() + " hết hàng!");
            }

            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepository.save(product);

            orderItems.add(OrderItem.builder()
                    .productId(cartItem.getProductId())
                    .sellerId(product.getSellerId()) 
                    .productName(cartItem.getProductName())
                    .quantity(cartItem.getQuantity())
                    .price(cartItem.getPrice())
                    .imageUrl(cartItem.getProductImage())
                    .shopName(cartItem.getShopName())
                    .build());

            baseTotalAmount += (cartItem.getPrice() * cartItem.getQuantity());

            notificationService.createNotification(
                product.getSellerId(),
                "Đơn hàng mới từ " + user.getFullName(),
                "Sản phẩm: " + product.getName(),
                "ORDER",
                null
            );
        }

        double finalTotalAmount = baseTotalAmount;
        double voucherDiscount = 0;
        double coinDiscount = 0;

        // 🚀 BƯỚC 1: XỬ LÝ VOUCHER XẾP CHỒNG (STACKING)
        if (orderRequest.getAppliedVoucherIds() != null && !orderRequest.getAppliedVoucherIds().isEmpty()) {
            for (String voucherId : orderRequest.getAppliedVoucherIds()) {
                Voucher voucher = voucherRepository.findById(voucherId)
                        .orElseThrow(() -> new RuntimeException("Voucher không tồn tại!"));

                if (!voucher.isActive() || 
                    LocalDateTime.now().isBefore(voucher.getValidFrom()) || 
                    LocalDateTime.now().isAfter(voucher.getValidUntil())) {
                    throw new RuntimeException("Voucher " + voucher.getCode() + " đã hết hạn hoặc không hợp lệ!");
                }
                if (voucher.getUsedCount() >= voucher.getUsageLimit()) {
                    throw new RuntimeException("Voucher " + voucher.getCode() + " đã hết lượt sử dụng!");
                }
                if (baseTotalAmount < voucher.getMinOrderValue()) {
                    throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng Voucher " + voucher.getCode() + "!");
                }

                double currentDiscount = 0;
                if ("PERCENTAGE".equals(voucher.getDiscountType())) {
                    currentDiscount = baseTotalAmount * (voucher.getDiscountValue() / 100.0);
                    if (voucher.getMaxDiscountAmount() > 0 && currentDiscount > voucher.getMaxDiscountAmount()) {
                        currentDiscount = voucher.getMaxDiscountAmount();
                    }
                } else {
                    currentDiscount = voucher.getDiscountValue();
                }

                if (currentDiscount > finalTotalAmount) {
                    currentDiscount = finalTotalAmount;
                }
                
                finalTotalAmount -= currentDiscount;
                voucherDiscount += currentDiscount;

                voucher.setUsedCount(voucher.getUsedCount() + 1);
                voucherRepository.save(voucher);
            }
        }

        // 🚀 BƯỚC 2: XỬ LÝ XU (COIN BURN)
        if (orderRequest.getUsedCoins() > 0) {
            Wallet wallet = walletRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Ví AiNetsoft của người dùng!"));
            
            if (wallet.getCoinBalance() < orderRequest.getUsedCoins()) {
                throw new RuntimeException("Số dư AiNetsoft Xu không đủ!");
            }

            double requestedCoinDiscount = orderRequest.getUsedCoins();
            
            double maxCoinUsage = finalTotalAmount * 0.5;
            if (requestedCoinDiscount > maxCoinUsage) {
                requestedCoinDiscount = maxCoinUsage; 
            }

            coinDiscount = requestedCoinDiscount;
            finalTotalAmount -= coinDiscount;

            wallet.setCoinBalance(wallet.getCoinBalance() - (int)coinDiscount);
            wallet.setUpdatedAt(LocalDateTime.now());
            walletRepository.save(wallet);
            
            orderRequest.setUsedCoins((int)coinDiscount);
        }

        orderRequest.setItems(orderItems);
        orderRequest.setTotalAmount(baseTotalAmount);
        orderRequest.setVoucherDiscountAmount(voucherDiscount);
        orderRequest.setCoinDiscountAmount(coinDiscount);
        orderRequest.setFinalTotalAmount(finalTotalAmount);
        
        orderRequest.setStatus("PENDING");
        orderRequest.setCreatedAt(LocalDateTime.now());
        orderRequest.setUpdatedAt(LocalDateTime.now());

        Order savedOrder = orderRepository.save(orderRequest);

        notificationService.createNotification(user.getId(), "Đặt hàng thành công", "Mã đơn: " + savedOrder.getId(), "ORDER", savedOrder.getId());
        
        user.setCart(new ArrayList<>());
        userRepository.save(user);

        return savedOrder;
    }

    public Map<String, Object> checkReviewEligibility(String productId, String userId) {
        Map<String, Object> result = new HashMap<>();
        List<Order> eligibleOrders = orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "COMPLETED")
                .stream()
                .filter(o -> !o.isReviewed())
                .filter(o -> o.getItems().stream().anyMatch(item -> item.getProductId().equals(productId)))
                .collect(Collectors.toList());

        if (!eligibleOrders.isEmpty()) {
            result.put("eligible", true);
            result.put("orderId", eligibleOrders.get(0).getId());
        } else {
            result.put("eligible", false);
        }
        return result;
    }

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
                    .sellerId(product.getSellerId())
                    .productName(cartItem.getProductName())
                    .quantity(cartItem.getQuantity())
                    .price(cartItem.getPrice())
                    .imageUrl(cartItem.getProductImage()) 
                    .shopName(cartItem.getShopName())
                    .build());

            totalAmount += (cartItem.getPrice() * cartItem.getQuantity());

            notificationService.createNotification(
                product.getSellerId(),
                "Đơn hàng mới từ " + user.getFullName(),
                "Bạn có đơn hàng mới cho sản phẩm: " + product.getName(),
                "ORDER",
                null 
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
                .finalTotalAmount(totalAmount) 
                .shippingAddress(shippingAddr)
                .paymentMethod(paymentMethod)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(newOrder);

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

        return savedOrder;
    }

    @Transactional
    public Order updateStatus(String orderId, String newStatus, String sellerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại!"));

        order.setStatus(newStatus.toUpperCase());
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

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

        // 🚀 BẢN VÁ: Cho phép hủy đơn ở tất cả các trạng thái trước khi bàn giao vận chuyển
        String currentStatus = order.getStatus() != null ? order.getStatus().trim().toUpperCase() : "";
        if (!"PENDING".equals(currentStatus) && !"CONFIRMED".equals(currentStatus) && !"PROCESSING".equals(currentStatus)) {
            throw new RuntimeException("Không thể hủy đơn hàng đã được bàn giao cho đơn vị vận chuyển!");
        }

        // Hoàn trả lại kho
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(p -> {
                p.setStock(p.getStock() + item.getQuantity());
                productRepository.save(p);
            });
        }
        
        // Hoàn trả Xu
        if (order.getUsedCoins() > 0) {
             walletRepository.findByUserId(userId).ifPresent(wallet -> {
                 wallet.setCoinBalance(wallet.getCoinBalance() + order.getUsedCoins());
                 wallet.setUpdatedAt(LocalDateTime.now());
                 walletRepository.save(wallet);
             });
        }
        
        // Hoàn trả Voucher
        if (order.getAppliedVoucherIds() != null && !order.getAppliedVoucherIds().isEmpty()) {
            for (String vid : order.getAppliedVoucherIds()) {
                voucherRepository.findById(vid).ifPresent(v -> {
                    if (v.getUsedCount() > 0) {
                        v.setUsedCount(v.getUsedCount() - 1);
                        voucherRepository.save(v);
                    }
                });
            }
        }

        order.setStatus("CANCELLED");
        order.setUpdatedAt(LocalDateTime.now());
        order.setReviewed(false); 
        orderRepository.save(order);
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
        if (status == null || status.equalsIgnoreCase("ALL") || status.isBlank()) {
            return orderRepository.findAll().stream()
                    .filter(o -> o.getItems().stream().anyMatch(i -> sellerId.equals(i.getSellerId())))
                    .collect(Collectors.toList());
        }
        return orderRepository.findAll().stream()
                .filter(o -> status.equalsIgnoreCase(o.getStatus()))
                .filter(o -> o.getItems().stream().anyMatch(i -> sellerId.equals(i.getSellerId())))
                .collect(Collectors.toList());
    }

    public Order getOrderById(String id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }    

    public List<Order> getAllSystemOrders() {
        return orderRepository.findAll().stream()
                .sorted((o1, o2) -> {
                    if (o1.getCreatedAt() == null || o2.getCreatedAt() == null) return 0;
                    return o2.getCreatedAt().compareTo(o1.getCreatedAt());
                })
                .collect(Collectors.toList());
    }
}