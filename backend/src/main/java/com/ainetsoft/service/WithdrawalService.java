package com.ainetsoft.service;

import com.ainetsoft.model.BankAccount;
import com.ainetsoft.model.Order;
import com.ainetsoft.model.PlatformConfig;
import com.ainetsoft.model.User;
import com.ainetsoft.model.Wallet;
import com.ainetsoft.model.WithdrawalRequest;
import com.ainetsoft.repository.OrderRepository;
import com.ainetsoft.repository.PlatformConfigRepository;
import com.ainetsoft.repository.UserRepository;
import com.ainetsoft.repository.WalletRepository;
import com.ainetsoft.repository.WithdrawalRepository;
import com.ainetsoft.service.bank.BankTransferProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private final WalletRepository walletRepository; 
    private final BankAccountService bankAccountService;
    private final NotificationService notificationService;
    private final BankTransferProvider bankTransferProvider;
    private final PlatformConfigRepository configRepository;

    public boolean getAutoPayoutStatus() {
        return configRepository.findAll().stream().findFirst()
                .map(PlatformConfig::isAutoPayoutEnabled).orElse(false);
    }

    @Transactional
    public boolean toggleAutoPayout(boolean status) {
        PlatformConfig config = configRepository.findAll().stream().findFirst().orElse(new PlatformConfig());
        config.setAutoPayoutEnabled(status);
        config.setUpdatedAt(LocalDateTime.now());
        configRepository.save(config);
        return status;
    }

    // ==========================================
    // LOGIC DÀNH CHO SELLER
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
                .filter(r -> !"REJECTED".equals(r.getStatus()) && !"FAILED".equals(r.getStatus()))
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
    // LOGIC DÀNH CHO BUYER (USER)
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

        wallet.setBalance(currentBalance - amount);
        walletRepository.save(wallet);

        WithdrawalRequest request = WithdrawalRequest.builder()
                .targetType("BUYER")
                .userId(userId)
                .shopName(user.getFullName()) 
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
    // 🚀 LOGIC CHUNG (ADMIN XỬ LÝ)
    // ==========================================
    public long countPendingRequests() {
        return withdrawalRepository.countByStatus("PENDING");
    }

    // 🚀 BỔ SUNG: Phân trang và Lọc từ Database
    public Page<WithdrawalRequest> getAllRequests(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            return withdrawalRepository.findByStatus(status.toUpperCase(), pageable);
        }
        return withdrawalRepository.findAll(pageable);
    }

    @Transactional
    public WithdrawalRequest processRequest(String requestId, String status, String adminNote) {
        WithdrawalRequest request = withdrawalRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Yêu cầu không tồn tại!"));

        if (!"PENDING".equals(request.getStatus()) && !"PROCESSING".equals(request.getStatus())) {
            throw new RuntimeException("Yêu cầu này đã được xử lý xong. Vui lòng tải lại trang.");
        }

        String targetStatus = status.toUpperCase();
        String finalNote = adminNote != null ? adminNote : "";
        boolean autoPayoutEnabled = getAutoPayoutStatus();

        if ("APPROVED".equals(targetStatus) || "COMPLETED".equals(targetStatus)) {
            if (autoPayoutEnabled && "PENDING".equals(request.getStatus())) {
                String transferDesc = "AINETSOFT PAYOUT " + request.getId().substring(request.getId().length() - 6).toUpperCase();
                BankTransferProvider.TransferResult result = bankTransferProvider.sendMoney(
                        request.getAccountNumber(), request.getBankName(), request.getAccountHolder(), request.getAmount(), transferDesc
                );
                if (result.success()) {
                    targetStatus = "COMPLETED";
                    finalNote = finalNote + " | [AUTO-PAYOUT] " + result.message() + " - TXN: " + result.transactionId();
                } else {
                    targetStatus = "FAILED";
                    finalNote = finalNote + " | [AUTO-PAYOUT LỖI] " + result.message();
                }
            } else if (!autoPayoutEnabled && "APPROVED".equals(targetStatus) && "PENDING".equals(request.getStatus())) {
                targetStatus = "PROCESSING";
                finalNote = finalNote + " | [MANUAL] Đang chờ Admin chuyển khoản thủ công.";
            } else if ("COMPLETED".equals(targetStatus) && "PROCESSING".equals(request.getStatus())) {
                targetStatus = "COMPLETED";
                finalNote = finalNote + " | [MANUAL] Admin đã xác nhận chuyển khoản thủ công thành công.";
            }
        }

        request.setStatus(targetStatus);
        request.setAdminNote(finalNote);
        request.setProcessedAt(LocalDateTime.now());

        if (("REJECTED".equals(targetStatus) || "FAILED".equals(targetStatus)) && "BUYER".equals(request.getTargetType())) {
            Wallet wallet = walletRepository.findByUserId(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy ví người dùng để hoàn tiền!"));
            double current = wallet.getBalance() != null ? wallet.getBalance() : 0.0;
            wallet.setBalance(current + request.getAmount());
            walletRepository.save(wallet);
            log.info("Refunded {} to User Wallet {} due to status: {}", request.getAmount(), request.getUserId(), targetStatus);
        }

        WithdrawalRequest saved = withdrawalRepository.save(request);

        String message = "";
        if (targetStatus.equals("COMPLETED")) {
            message = "Yêu cầu rút tiền " + String.format("%,.0f", request.getAmount()) + "₫ đã được chuyển khoản thành công!";
        } else if (targetStatus.equals("PROCESSING")) {
            message = "Yêu cầu rút tiền " + String.format("%,.0f", request.getAmount()) + "₫ đã được duyệt. Tiền sẽ về tài khoản trong 24h.";
        } else if (targetStatus.equals("FAILED")) {
            message = "Giao dịch rút tiền thất bại do lỗi hệ thống ngân hàng. Hệ thống đã hoàn tiền, vui lòng thử lại sau.";
        } else if (targetStatus.equals("REJECTED")) {
            message = "Yêu cầu rút tiền bị từ chối. Lý do: " + adminNote;
        }

        if (!message.isEmpty()) {
            String notifyId = "BUYER".equals(request.getTargetType()) ? request.getUserId() : request.getSellerId();
            try {
                if (notifyId != null) {
                    notificationService.createNotification(notifyId, "Cập nhật tài chính", message, "SYSTEM", null);
                }
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo cho tài khoản {}", notifyId);
            }
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
