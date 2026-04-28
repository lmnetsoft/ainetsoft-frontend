package com.ainetsoft.service;

import com.ainetsoft.model.BankAccount;
import com.ainetsoft.model.Order;
import com.ainetsoft.model.User;
import com.ainetsoft.model.WithdrawalRequest;
import com.ainetsoft.repository.OrderRepository;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.WithdrawalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WithdrawalService {

    private final WithdrawalRepository withdrawalRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository; 
    private final BankAccountService bankAccountService;
    private final NotificationService notificationService;

    public double getSellerBalance(String sellerId) {
        List<Order> completedOrders = orderRepository.findByItemsSellerIdAndStatus(sellerId, "COMPLETED");
        
        double totalRevenue = completedOrders.stream()
                .flatMap(o -> o.getItems().stream())
                .filter(item -> sellerId.equals(item.getSellerId()))
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();

        List<WithdrawalRequest> requests = withdrawalRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
        double totalDeducted = requests.stream()
                .filter(r -> !"REJECTED".equals(r.getStatus()))
                .mapToDouble(WithdrawalRequest::getAmount)
                .sum();

        return totalRevenue - totalDeducted;
    }

    public long countPendingRequests() {
        return withdrawalRepository.countByStatus("PENDING");
    }

    @Transactional
    public WithdrawalRequest createWithdrawalRequest(String sellerId, double amount) {
        if (amount < 50000) {
            throw new RuntimeException("Số tiền rút tối thiểu là 50.000₫");
        }

        double currentBalance = getSellerBalance(sellerId);
        if (amount > currentBalance) {
            throw new RuntimeException("Số dư không đủ để thực hiện yêu cầu này!");
        }

        boolean hasPending = withdrawalRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .anyMatch(r -> "PENDING".equals(r.getStatus()));
        if (hasPending) {
            throw new RuntimeException("Bạn đang có một yêu cầu rút tiền chờ xử lý. Vui lòng đợi Admin duyệt trước khi tạo lệnh mới.");
        }

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người bán!"));

        List<BankAccount> banks = bankAccountService.getBankAccountsByUserId(sellerId);
        if (banks == null || banks.isEmpty()) {
            throw new RuntimeException("Bạn chưa thêm tài khoản ngân hàng nào.");
        }
        
        BankAccount defaultBank = banks.stream()
                .filter(BankAccount::isDefault)
                .findFirst()
                .orElse(banks.get(0)); // Nếu quên set default, lấy tạm tài khoản đầu tiên

        WithdrawalRequest request = WithdrawalRequest.builder()
                .sellerId(sellerId)
                .shopName(seller.getShopProfile() != null ? seller.getShopProfile().getShopName() : seller.getFullName())
                .sellerFullName(seller.getFullName())
                .amount(amount)
                .bankName(defaultBank.getBankName())
                .accountNumber(defaultBank.getAccountNumber())
                .accountHolder(defaultBank.getAccountHolder())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        log.info("🚀 Financial Request Created: {} VND for Shop: {}", amount, request.getShopName());
        WithdrawalRequest savedRequest = withdrawalRepository.save(request);

        try {
            List<User> admins = userRepository.findByRolesContaining("ADMIN");
            String adminMsg = "Shop " + request.getShopName() + " vừa gửi yêu cầu rút " + String.format("%,.0f", amount) + "₫";
            
            admins.forEach(admin -> {
                notificationService.createNotification(
                    admin.getId(),
                    "Yêu cầu rút tiền mới",
                    adminMsg,
                    "WITHDRAWAL",
                    savedRequest.getId()
                );
            });
        } catch (Exception e) {
            log.error("Failed to notify admins: {}", e.getMessage());
        }

        return savedRequest;
    }

    public List<WithdrawalRequest> getSellerHistory(String sellerId) {
        return withdrawalRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
    }

    public List<WithdrawalRequest> getAllRequests() {
        return withdrawalRepository.findAll(); // Có thể bổ sung sort theo CreatedAtDesc nếu cần
    }

    @Transactional
    public WithdrawalRequest processRequest(String requestId, String status, String adminNote) {
        WithdrawalRequest request = withdrawalRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Yêu cầu không tồn tại!"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Yêu cầu này đã được xử lý trước đó. Vui lòng tải lại trang.");
        }

        request.setStatus(status.toUpperCase());
        request.setAdminNote(adminNote != null ? adminNote : "");
        request.setProcessedAt(LocalDateTime.now());

        WithdrawalRequest saved = withdrawalRepository.save(request);

        String message = status.equalsIgnoreCase("COMPLETED") 
            ? "Yêu cầu rút tiền " + String.format("%,.0f", request.getAmount()) + "₫ đã được chuyển khoản thành công!" 
            : "Yêu cầu rút tiền bị từ chối. Lý do: " + adminNote;

        try {
            notificationService.createNotification(
                    request.getSellerId(), 
                    "Cập nhật tài chính", 
                    message, 
                    "SYSTEM", 
                    null
            );
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo cho Seller {}", request.getSellerId());
        }

        return saved;
    }
}