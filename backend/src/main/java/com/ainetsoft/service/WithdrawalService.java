package com.ainetsoft.service;

import com.ainetsoft.model.BankAccount;
import com.ainetsoft.model.Order;
import com.ainetsoft.model.User;
import com.ainetsoft.model.Wallet;
import com.ainetsoft.model.WithdrawalRequest;
import com.ainetsoft.repository.OrderRepository;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.WalletRepository;
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
    private final WalletRepository walletRepository; // 🚀 Inject Wallet để xử lý tiền Buyer
    private final BankAccountService bankAccountService;
    private final NotificationService notificationService;

    // ==========================================
    // LOGIC DÀNH CHO SELLER (Giữ nguyên)
    // ==========================================
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
                .orElse(banks.get(0));

        WithdrawalRequest request = WithdrawalRequest.builder()
                .targetType("SELLER")
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
        return saveAndNotifyAdmins(request);
    }

    public List<WithdrawalRequest> getSellerHistory(String sellerId) {
        return withdrawalRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
    }

    // ==========================================
    // 🚀 LOGIC DÀNH CHO BUYER (USER)
    // ==========================================
    @Transactional
    public WithdrawalRequest createUserWithdrawalRequest(String userId, double amount) {
        if (amount < 50000) {
            throw new RuntimeException("Số tiền rút tối thiểu là 50.000₫");
        }

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví của bạn!"));

        double currentBalance = wallet.getBalance() != null ? wallet.getBalance() : 0.0;
        if (amount > currentBalance) {
            throw new RuntimeException("Số dư khả dụng trong ví không đủ!");
        }

        boolean hasPending = withdrawalRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .anyMatch(r -> "PENDING".equals(r.getStatus()));
        if (hasPending) {
            throw new RuntimeException("Bạn đang có yêu cầu rút tiền chờ xử lý. Vui lòng đợi duyệt.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người dùng!"));

        List<BankAccount> banks = bankAccountService.getBankAccountsByUserId(userId);
        if (banks == null || banks.isEmpty()) {
            throw new RuntimeException("Bạn chưa thêm tài khoản ngân hàng nào.");
        }

        BankAccount defaultBank = banks.stream()
                .filter(BankAccount::isDefault)
                .findFirst()
                .orElse(banks.get(0));

        // 🚀 Trừ tiền ngay lập tức trong ví để tránh rút lố
        wallet.setBalance(currentBalance - amount);
        walletRepository.save(wallet);

        WithdrawalRequest request = WithdrawalRequest.builder()
                .targetType("BUYER")
                .userId(userId)
                .shopName(user.getFullName()) // Admin dashboard sẽ hiển thị tên User
                .sellerFullName(user.getFullName())
                .amount(amount)
                .bankName(defaultBank.getBankName())
                .accountNumber(defaultBank.getAccountNumber())
                .accountHolder(defaultBank.getAccountHolder())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        log.info("🚀 User Withdrawal Request Created: {} VND for User: {}", amount, request.getShopName());
        return saveAndNotifyAdmins(request);
    }

    public List<WithdrawalRequest> getUserHistory(String userId) {
        return withdrawalRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // ==========================================
    // LOGIC CHUNG (ADMIN XỬ LÝ)
    // ==========================================
    public long countPendingRequests() {
        return withdrawalRepository.countByStatus("PENDING");
    }

    public List<WithdrawalRequest> getAllRequests() {
        return withdrawalRepository.findAll();
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

        // 🚀 NẾU LÀ BUYER VÀ BỊ TỪ CHỐI -> HOÀN LẠI TIỀN VÀO VÍ
        if ("REJECTED".equals(status.toUpperCase()) && "BUYER".equals(request.getTargetType())) {
            Wallet wallet = walletRepository.findByUserId(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy ví người dùng để hoàn tiền!"));
            double current = wallet.getBalance() != null ? wallet.getBalance() : 0.0;
            wallet.setBalance(current + request.getAmount());
            walletRepository.save(wallet);
            log.info("Refunded {} to User Wallet {}", request.getAmount(), request.getUserId());
        }

        WithdrawalRequest saved = withdrawalRepository.save(request);

        String message = status.equalsIgnoreCase("COMPLETED") 
            ? "Yêu cầu rút tiền " + String.format("%,.0f", request.getAmount()) + "₫ đã được chuyển khoản thành công!" 
            : "Yêu cầu rút tiền bị từ chối. Lý do: " + adminNote;

        String notifyId = "BUYER".equals(request.getTargetType()) ? request.getUserId() : request.getSellerId();
        
        try {
            if (notifyId != null) {
                notificationService.createNotification(
                        notifyId, 
                        "Cập nhật tài chính", 
                        message, 
                        "SYSTEM", 
                        null
                );
            }
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo cho tài khoản {}", notifyId);
        }

        return saved;
    }

    private WithdrawalRequest saveAndNotifyAdmins(WithdrawalRequest request) {
        WithdrawalRequest savedRequest = withdrawalRepository.save(request);
        try {
            List<User> admins = userRepository.findByRolesContaining("ADMIN");
            String typeLabel = "BUYER".equals(request.getTargetType()) ? "Người dùng " : "Shop ";
            String adminMsg = typeLabel + request.getShopName() + " vừa gửi yêu cầu rút " + String.format("%,.0f", request.getAmount()) + "₫";
            
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
}
