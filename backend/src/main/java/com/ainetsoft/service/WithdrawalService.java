package com.ainetsoft.service;

import com.ainetsoft.model.BankAccount;
import com.ainetsoft.model.Order;
import com.ainetsoft.model.WithdrawalRequest;
import com.ainetsoft.repository.OrderRepository;
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
    private final BankAccountService bankAccountService;
    private final NotificationService notificationService;

    /**
     * 🚀 ELITE LOGIC: Calculates the actual wallet balance.
     */
    public double getSellerBalance(String sellerId) {
        List<Order> completedOrders = orderRepository.findBySellerIdAndStatus(sellerId, "COMPLETED");
        
        double totalRevenue = completedOrders.stream()
                .flatMap(o -> o.getItems().stream())
                .filter(item -> sellerId.equals(item.getSellerId()))
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();

        List<WithdrawalRequest> requests = withdrawalRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
        double totalWithdrawn = requests.stream()
                .filter(r -> !"REJECTED".equals(r.getStatus()))
                .mapToDouble(WithdrawalRequest::getAmount)
                .sum();

        return totalRevenue - totalWithdrawn;
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
            throw new RuntimeException("Bạn đang có một yêu cầu rút tiền chờ xử lý.");
        }

        List<BankAccount> banks = bankAccountService.getBankAccountsByUserId(sellerId);
        BankAccount defaultBank = banks.stream()
                .filter(BankAccount::isDefault)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Vui lòng thiết lập tài khoản ngân hàng mặc định trước!"));

        WithdrawalRequest request = WithdrawalRequest.builder()
                .sellerId(sellerId)
                .amount(amount)
                .bankName(defaultBank.getBankName())
                .accountNumber(defaultBank.getAccountNumber())
                .accountHolder(defaultBank.getAccountHolder())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        WithdrawalRequest saved = withdrawalRepository.save(request);
        log.info("New Withdrawal Request: {} VND from Seller {}", amount, sellerId);
        
        return saved;
    }

    public List<WithdrawalRequest> getSellerHistory(String sellerId) {
        return withdrawalRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
    }

    // --- 🚀 NEW: ADMIN LOGIC SECTION ---

    /**
     * Fetches all requests for the Admin dashboard.
     */
    public List<WithdrawalRequest> getAllRequests() {
        return withdrawalRepository.findAll();
    }

    /**
     * 🛠️ ADMIN ACTION: Process a withdrawal request.
     */
    @Transactional
    public WithdrawalRequest processRequest(String requestId, String status, String adminNote) {
        WithdrawalRequest request = withdrawalRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Yêu cầu không tồn tại!"));

        // Security: Don't allow changing a finished request
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Yêu cầu này đã được xử lý trước đó và không thể thay đổi.");
        }

        request.setStatus(status.toUpperCase());
        request.setAdminNote(adminNote);
        request.setProcessedAt(LocalDateTime.now());

        WithdrawalRequest saved = withdrawalRepository.save(request);

        // Notify the seller about the decision
        String message = status.equalsIgnoreCase("COMPLETED") 
            ? "Yêu cầu rút tiền " + String.format("%,.0f", request.getAmount()) + "₫ đã thành công!" 
            : "Yêu cầu rút tiền của bạn bị từ chối. Lý do: " + adminNote;

        notificationService.createNotification(
            request.getSellerId(), 
            "Cập nhật yêu cầu rút tiền", 
            message, 
            "SYSTEM", 
            null
        );

        return saved;
    }
}