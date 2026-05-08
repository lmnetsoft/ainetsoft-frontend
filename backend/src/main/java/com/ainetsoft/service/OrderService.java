package com.ainetsoft.service;

import com.ainetsoft.model.*;
import com.ainetsoft.repository.BankAccountRepository; 
import com.ainetsoft.repository.OrderRepository;
import com.ainetsoft.repository.PlatformConfigRepository;
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
    private final PlatformConfigRepository platformConfigRepository; 

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

        if (orderRequest.getAppliedVoucherIds() != null && !orderRequest.getAppliedVoucherIds().isEmpty()) {
            List<Order> pastOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

            for (String voucherId : orderRequest.getAppliedVoucherIds()) {
                Voucher voucher = voucherRepository.findById(voucherId)
                        .orElseThrow(() -> new RuntimeException("Voucher không tồn tại!"));

                if (!voucher.isActive() || 
                    LocalDateTime.now().isBefore(voucher.getValidFrom()) || 
                    LocalDateTime.now().isAfter(voucher.getValidUntil())) {
                    throw new RuntimeException("Voucher " + voucher.getCode() + " đã hết hạn hoặc không hợp lệ!");
                }
                if (voucher.getUsedCount() >= voucher.getUsageLimit()) {
                    throw new RuntimeException("Voucher " + voucher.getCode() + " đã hết lượt sử dụng toàn sàn!");
                }
                if (baseTotalAmount < voucher.getMinOrderValue()) {
                    throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng Voucher " + voucher.getCode() + "!");
                }

                boolean hasUsed = pastOrders.stream()
                        .filter(o -> !"CANCELLED".equalsIgnoreCase(o.getStatus())) 
                        .anyMatch(o -> o.getAppliedVoucherIds() != null && o.getAppliedVoucherIds().contains(voucherId));
                
                if (hasUsed) {
                    throw new RuntimeException("Bạn đã sử dụng Voucher " + voucher.getCode() + " trước đó! Mỗi tài khoản chỉ được áp dụng 1 lần.");
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

                walletRepository.findByUserId(user.getId()).ifPresent(wallet -> {
                    if (wallet.getSavedVoucherIds() != null && wallet.getSavedVoucherIds().contains(voucherId)) {
                        wallet.getSavedVoucherIds().remove(voucherId);
                        wallet.setUpdatedAt(LocalDateTime.now());
                        walletRepository.save(wallet);
                    }
                });
            }
        }

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
        orderRequest.setReturnStatus("NONE"); 
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
                .returnStatus("NONE")
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

        if ("RETURNING".equals(order.getStatus())) {
            throw new RuntimeException("Đơn hàng đang có khiếu nại Trả hàng/Hoàn tiền, không thể thay đổi trạng thái!");
        }

        String oldStatus = order.getStatus() != null ? order.getStatus().toUpperCase() : "";
        order.setStatus(newStatus.toUpperCase());
        order.setUpdatedAt(LocalDateTime.now());
        
        if ("SHIPPING".equals(newStatus.toUpperCase()) && !"SHIPPING".equals(oldStatus)) {
            String trackingCode = "GHN-" + java.util.UUID.randomUUID().toString().substring(0, 10).toUpperCase();
            order.setTrackingCode(trackingCode);
            order.setShippingProvider("Giao Hàng Nhanh");
            order.setCarrierStatus("PICKED_UP"); 
            order.setReturnDeadline(LocalDateTime.now().plusDays(3));
        }

        if ("COMPLETED".equals(newStatus.toUpperCase()) && !"COMPLETED".equals(oldStatus)) {
            PlatformConfig config = platformConfigRepository.findAll().stream().findFirst().orElse(new PlatformConfig());
            int earnedCoins = (int) (order.getFinalTotalAmount() * config.getCashbackRate());
            
            if (earnedCoins > config.getMaxCoinsPerOrder()) {
                earnedCoins = config.getMaxCoinsPerOrder();
            }
            
            if (earnedCoins > 0) {
                final int finalEarnedCoins = earnedCoins;
                walletRepository.findByUserId(order.getUserId()).ifPresent(wallet -> {
                    wallet.setCoinBalance(wallet.getCoinBalance() + finalEarnedCoins);
                    wallet.setUpdatedAt(LocalDateTime.now());
                    walletRepository.save(wallet);
                });
                notificationService.createNotification(order.getUserId(), "🎉 Chúc mừng bạn nhận được Xu!", "Bạn đã được cộng " + earnedCoins + " AiNetsoft Xu từ đơn hàng " + order.getId(), "WALLET", null);
            }
            
            if (order.getReturnDeadline() == null) {
                order.setReturnDeadline(LocalDateTime.now().plusDays(3));
            }
        }

        Order saved = orderRepository.save(order);

        String message = switch(newStatus.toUpperCase()) {
            case "SHIPPING" -> "Đơn hàng của bạn đã được giao cho đơn vị vận chuyển (" + saved.getTrackingCode() + ").";
            case "COMPLETED" -> "Đơn hàng đã giao thành công. Hãy để lại đánh giá nhé!";
            default -> "Trạng thái đơn hàng của bạn đã thay đổi thành: " + newStatus;
        };

        notificationService.createNotification(order.getUserId(), "Cập nhật đơn hàng", message, "ORDER", order.getId());
        return saved;
    }

    @Transactional
    public void processShippingWebhook(String trackingCode, String carrierStatus, String note) {
        Order order = orderRepository.findAll().stream()
                .filter(o -> trackingCode.equals(o.getTrackingCode()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã vận đơn: " + trackingCode));

        order.setCarrierStatus(carrierStatus.toUpperCase());
        order.setUpdatedAt(LocalDateTime.now());
        
        String message = "Kiện hàng " + trackingCode + " đang được cập nhật: " + carrierStatus;
        
        if ("DELIVERED".equalsIgnoreCase(carrierStatus)) {
            order.setReturnDeadline(LocalDateTime.now().plusDays(3)); 
            message = "🎉 Gói hàng đã giao thành công. Bạn có 3 ngày để kiểm tra và Yêu cầu Trả hàng nếu có lỗi!";
        } else if ("IN_TRANSIT".equalsIgnoreCase(carrierStatus)) {
            message = "🚚 Gói hàng của bạn đang trên đường vận chuyển tới kho đích.";
        }
        
        orderRepository.save(order);
        notificationService.createNotification(order.getUserId(), "Cập nhật Vận chuyển 📦", message, "SHIPPING", order.getId());
    }

    @Transactional
    public Order requestReturn(String orderId, String userId, String reason, String description, double refundAmount, String email, List<String> images) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại!"));

        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này!");
        }

        if ("CANCELLED".equals(order.getStatus())) {
            throw new RuntimeException("Đơn hàng đã bị hủy, không thể yêu cầu trả hàng.");
        }

        if (order.getReturnDeadline() != null && LocalDateTime.now().isAfter(order.getReturnDeadline())) {
            throw new RuntimeException("Đã quá hạn 3 ngày để yêu cầu trả hàng/hoàn tiền theo quy định.");
        }

        if (refundAmount > order.getFinalTotalAmount()) {
            throw new RuntimeException("Số tiền yêu cầu hoàn trả vượt quá tổng giá trị thanh toán thực tế!");
        }

        order.setStatus("RETURNING"); 
        order.setReturnStatus("REQUESTED");
        order.setReturnReason(reason);
        order.setReturnDescription(description);
        order.setRequestedRefundAmount(refundAmount);
        order.setReturnEmail(email);
        order.setReturnImages(images != null ? images : new ArrayList<>());
        order.setUpdatedAt(LocalDateTime.now());
        
        notificationService.createNotification(order.getItems().get(0).getSellerId(), "⚠️ Yêu cầu trả hàng", "Người mua vừa yêu cầu hoàn số tiền ₫" + refundAmount + " cho đơn #" + orderId.substring(orderId.length() - 8).toUpperCase(), "RETURN", orderId);
        
        return orderRepository.save(order);
    }

    @Transactional
    public Order processReturn(String orderId, String sellerId, boolean isApproved) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại!"));
        
        if (sellerId != null && !order.getItems().get(0).getSellerId().equals(sellerId)) {
            throw new RuntimeException("Bạn không có quyền xử lý đơn này!");
        }
        
        if (!"REQUESTED".equals(order.getReturnStatus())) {
            throw new RuntimeException("Đơn hàng không ở trạng thái yêu cầu trả hàng.");
        }

        if (isApproved) {
            order.setStatus("RETURNED"); 
            order.setReturnStatus("APPROVED");
            
            for (OrderItem item : order.getItems()) {
                productRepository.findById(item.getProductId()).ifPresent(p -> {
                    p.setStock(p.getStock() + item.getQuantity());
                    productRepository.save(p);
                });
            }

            walletRepository.findByUserId(order.getUserId()).ifPresent(wallet -> {
                double currentBalance = wallet.getBalance() != null ? wallet.getBalance() : 0.0;
                wallet.setBalance(currentBalance + order.getRequestedRefundAmount());
                walletRepository.save(wallet);
            });
            
            if (order.getUsedCoins() > 0) {
                 walletRepository.findByUserId(order.getUserId()).ifPresent(wallet -> {
                     double refundRatio = order.getRequestedRefundAmount() / order.getFinalTotalAmount();
                     int coinsToRefund = (int) Math.round(order.getUsedCoins() * refundRatio);
                     if (coinsToRefund > 0) {
                         wallet.setCoinBalance(wallet.getCoinBalance() + coinsToRefund);
                         wallet.setUpdatedAt(LocalDateTime.now());
                         walletRepository.save(wallet);
                     }
                 });
            }
            
            PlatformConfig config = platformConfigRepository.findAll().stream().findFirst().orElse(new PlatformConfig());
            int expectedCashback = (int) (order.getFinalTotalAmount() * config.getCashbackRate());
            if (expectedCashback > config.getMaxCoinsPerOrder()) {
                expectedCashback = config.getMaxCoinsPerOrder();
            }
            
            if (expectedCashback > 0) {
                final int coinsToRevoke = expectedCashback;
                walletRepository.findByUserId(order.getUserId()).ifPresent(wallet -> {
                    wallet.setCoinBalance(Math.max(0, wallet.getCoinBalance() - coinsToRevoke));
                    walletRepository.save(wallet);
                });
            }
            
            if (order.getRequestedRefundAmount() >= order.getFinalTotalAmount() && order.getAppliedVoucherIds() != null && !order.getAppliedVoucherIds().isEmpty()) {
                for (String vid : order.getAppliedVoucherIds()) {
                    voucherRepository.findById(vid).ifPresent(v -> {
                        if (v.getUsedCount() > 0) {
                            v.setUsedCount(v.getUsedCount() - 1);
                            voucherRepository.save(v);
                        }
                    });
                    
                    walletRepository.findByUserId(order.getUserId()).ifPresent(wallet -> {
                        if (wallet.getSavedVoucherIds() != null && !wallet.getSavedVoucherIds().contains(vid)) {
                            wallet.getSavedVoucherIds().add(vid);
                            wallet.setUpdatedAt(LocalDateTime.now());
                            walletRepository.save(wallet);
                        }
                    });
                }
            }
            
            notificationService.createNotification(order.getUserId(), "✅ Trả hàng thành công", "Người bán đã chấp nhận hoàn tiền cho đơn #" + orderId.substring(orderId.length() - 8).toUpperCase(), "RETURN", orderId);
        } else {
            order.setStatus("COMPLETED"); 
            order.setReturnStatus("REJECTED");
            
            PlatformConfig config = platformConfigRepository.findAll().stream().findFirst().orElse(new PlatformConfig());
            int earnedCoins = (int) (order.getFinalTotalAmount() * config.getCashbackRate());
            if (earnedCoins > config.getMaxCoinsPerOrder()) earnedCoins = config.getMaxCoinsPerOrder();
            
            if (earnedCoins > 0) {
                final int finalEarnedCoins = earnedCoins;
                walletRepository.findByUserId(order.getUserId()).ifPresent(wallet -> {
                    wallet.setCoinBalance(wallet.getCoinBalance() + finalEarnedCoins);
                    wallet.setUpdatedAt(LocalDateTime.now());
                    walletRepository.save(wallet);
                });
            }
            
            notificationService.createNotification(order.getUserId(), "❌ Trả hàng bị từ chối", "Shop đã từ chối yêu cầu trả tiền cho đơn #" + orderId.substring(orderId.length() - 8).toUpperCase() + ". Đơn hàng đã tự động hoàn tất và bạn nhận được " + earnedCoins + " Xu.", "ORDER", orderId);
        }
        
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    // 🚀 ĐÃ SỬA: Hàm Hủy Đơn nhận thêm biến String cancelReason và cập nhật vào Database
    @Transactional
    public void cancelOrder(String orderId, String userId, String cancelReason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại!"));

        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy đơn hàng này!");
        }

        String currentStatus = order.getStatus() != null ? order.getStatus().trim().toUpperCase() : "";
        if (!"PENDING".equals(currentStatus) && !"CONFIRMED".equals(currentStatus) && !"PROCESSING".equals(currentStatus)) {
            throw new RuntimeException("Không thể hủy đơn hàng đã được bàn giao cho đơn vị vận chuyển!");
        }

        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(p -> {
                p.setStock(p.getStock() + item.getQuantity());
                productRepository.save(p);
            });
        }
        
        if (order.getUsedCoins() > 0) {
             walletRepository.findByUserId(userId).ifPresent(wallet -> {
                 wallet.setCoinBalance(wallet.getCoinBalance() + order.getUsedCoins());
                 wallet.setUpdatedAt(LocalDateTime.now());
                 walletRepository.save(wallet);
             });
        }
        
        if (order.getAppliedVoucherIds() != null && !order.getAppliedVoucherIds().isEmpty()) {
            for (String vid : order.getAppliedVoucherIds()) {
                voucherRepository.findById(vid).ifPresent(v -> {
                    if (v.getUsedCount() > 0) {
                        v.setUsedCount(v.getUsedCount() - 1); 
                        voucherRepository.save(v);
                    }
                });
                
                walletRepository.findByUserId(userId).ifPresent(wallet -> {
                    if (wallet.getSavedVoucherIds() != null && !wallet.getSavedVoucherIds().contains(vid)) {
                        wallet.getSavedVoucherIds().add(vid);
                        wallet.setUpdatedAt(LocalDateTime.now());
                        walletRepository.save(wallet);
                    }
                });
            }
        }

        // Cập nhật các trường hủy đơn mới
        order.setStatus("CANCELLED");
        order.setUpdatedAt(LocalDateTime.now());
        order.setReviewed(false); 
        
        if (cancelReason != null && !cancelReason.trim().isEmpty()) {
            order.setCancelReason(cancelReason);
        } else {
            order.setCancelReason("Người mua thay đổi ý định");
        }
        order.setCancelledBy("USER"); // Do endpoint này là API của Buyer gọi lên

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

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *") 
    @Transactional
    public void autoProcessExpiredReturns() {
        log.info("Chạy tiến trình tự động quyết toán đơn hàng quá hạn...");
        LocalDateTime now = LocalDateTime.now();
        
        List<Order> expiredOrders = orderRepository.findAll().stream()
                .filter(o -> "SHIPPING".equals(o.getStatus()))
                .filter(o -> "DELIVERED".equals(o.getCarrierStatus()))
                .filter(o -> o.getReturnDeadline() != null && now.isAfter(o.getReturnDeadline()))
                .collect(Collectors.toList());

        for (Order order : expiredOrders) {
            order.setStatus("COMPLETED");
            order.setUpdatedAt(now);
            
            PlatformConfig config = platformConfigRepository.findAll().stream().findFirst().orElse(new PlatformConfig());
            int earnedCoins = (int) (order.getFinalTotalAmount() * config.getCashbackRate());
            
            if (earnedCoins > config.getMaxCoinsPerOrder()) {
                earnedCoins = config.getMaxCoinsPerOrder();
            }
            
            if (earnedCoins > 0) {
                final int finalEarnedCoins = earnedCoins;
                walletRepository.findByUserId(order.getUserId()).ifPresent(wallet -> {
                    wallet.setCoinBalance(wallet.getCoinBalance() + finalEarnedCoins);
                    wallet.setUpdatedAt(now);
                    walletRepository.save(wallet);
                });
            }
            
            orderRepository.save(order);
            
            notificationService.createNotification(order.getUserId(), "Đơn hàng tự động hoàn thành", "Đã hết 3 ngày khiếu nại. Đơn hàng #" + order.getId().substring(order.getId().length() - 8).toUpperCase() + " đã hoàn tất. Bạn nhận được " + earnedCoins + " Xu.", "ORDER", order.getId());
            notificationService.createNotification(order.getItems().get(0).getSellerId(), "Tiền đã vào ví", "Đơn hàng #" + order.getId().substring(order.getId().length() - 8).toUpperCase() + " đã tự động hoàn tất. Doanh thu đã được ghi nhận.", "ORDER", order.getId());
        }
        if (!expiredOrders.isEmpty()) {
            log.info("Đã xử lý quyết toán thành công {} đơn hàng.", expiredOrders.size());
        }
    }
}
