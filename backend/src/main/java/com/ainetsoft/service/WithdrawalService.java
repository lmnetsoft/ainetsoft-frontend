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
    private final UserRepository userRepository; // 🚀 Required to fetch Shop/Seller names
    private final BankAccountService bankAccountService;
    private final NotificationService notificationService;

    /**
     * 💰 Calculates the live wallet balance by checking nested order items.
     */
    public double getSellerBalance(String sellerId) {
        // Find orders where this seller has items and status is COMPLETED
        List<Order> completedOrders = orderRepository.findByItemsSellerIdAndStatus(sellerId, "COMPLETED");
        
        double totalRevenue = completedOrders.stream()
                .flatMap(o -> o.getItems().stream())
                .filter(item -> sellerId.equals(item.getSellerId()))
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();

        // Subtract any committed funds (Pending or Completed withdrawals)
        List<WithdrawalRequest> requests = withdrawalRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
        double totalDeducted = requests.stream()
                .filter(r -> !"REJECTED".equals(r.getStatus()))
                .mapToDouble(WithdrawalRequest::getAmount)
                .sum();

        return totalRevenue - totalDeducted;
    }

    /**
     * 🔔 Used by the Admin Header to show the pending notification count.
     */
    public long countPendingRequests() {
        return withdrawalRepository.countByStatus("PENDING");
    }

    @Transactional
    public WithdrawalRequest createWithdrawalRequest(String sellerId, double amount) {
        // 1. Validation Logic
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
            throw new RuntimeException("Bạn đang có một yêu cầu rút tiền chờ xử lý.");
        }

        // 2. Fetch User & Bank Snapshots
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người bán!"));

        List<BankAccount> banks = bankAccountService.getBankAccountsByUserId(sellerId);
        BankAccount defaultBank = banks.stream()
                .filter(BankAccount::isDefault)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Vui lòng thiết lập tài khoản ngân hàng mặc định trước!"));

        // 3. Build Request with Snapshots for Admin Dashboard
        WithdrawalRequest request = WithdrawalRequest.builder()
                .sellerId(sellerId)
                .shopName(seller.getShopProfile() != null ? seller.getShopProfile().getShopName() : "Unknown Shop")
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

        // 🚀 NEW: Notify all Administrators about this new request
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
        return withdrawalRepository.findAll();
    }

    @Transactional
    public WithdrawalRequest processRequest(String requestId, String status, String adminNote) {
        WithdrawalRequest request = withdrawalRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Yêu cầu không tồn tại!"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Yêu cầu này đã được xử lý trước đó.");
        }

        request.setStatus(status.toUpperCase());
        request.setAdminNote(adminNote);
        request.setProcessedAt(LocalDateTime.now());

        WithdrawalRequest saved = withdrawalRepository.save(request);

        // 📩 Notify the seller of the result
        String message = status.equalsIgnoreCase("COMPLETED") 
            ? "Yêu cầu rút tiền " + String.format("%,.0f", request.getAmount()) + "₫ thành công!" 
            : "Yêu cầu rút tiền bị từ chối. Lý do: " + adminNote;

        notificationService.createNotification(
                request.getSellerId(), 
                "Cập nhật tài chính", 
                message, 
                "SYSTEM", 
                null
        );

        return saved;
    }
}