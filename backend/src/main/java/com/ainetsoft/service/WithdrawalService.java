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

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    public PlatformConfig getConfig() {
        return configRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    PlatformConfig defaultBtn = new PlatformConfig();
                    defaultBtn.setUpdatedAt(LocalDateTime.now());
                    return configRepository.save(defaultBtn);
                });
    }

    @Transactional
    public PlatformConfig updateFullConfig(PlatformConfig newConfig) {
        PlatformConfig current = getConfig();
        current.setCommissionRate(newConfig.getCommissionRate());
        current.setFlatWithdrawalFee(newConfig.getFlatWithdrawalFee());
        current.setMinWithdrawalAmount(newConfig.getMinWithdrawalAmount());
        current.setAutoPayoutMaxLimit(newConfig.getAutoPayoutMaxLimit());
        current.setMaxDailyWithdrawalsPerShop(newConfig.getMaxDailyWithdrawalsPerShop());
        current.setEscrowWindowDays(newConfig.getEscrowWindowDays());
        current.setTaxWithholdingRate(newConfig.getTaxWithholdingRate());
        current.setCashbackRate(newConfig.getCashbackRate());
        current.setMaxCoinsPerOrder(newConfig.getMaxCoinsPerOrder());
        current.setAutoPayoutEnabled(newConfig.isAutoPayoutEnabled());
        current.setUpdatedAt(LocalDateTime.now());
        return configRepository.save(current);
    }

    public boolean getAutoPayoutStatus() {
        return getConfig().isAutoPayoutEnabled();
    }

    @Transactional
    public boolean toggleAutoPayout(boolean status) {
        PlatformConfig config = getConfig();
        config.setAutoPayoutEnabled(status);
        config.setUpdatedAt(LocalDateTime.now());
        configRepository.save(config);
        return status;
    }

    public Map<String, Object> getWithdrawalKycDetails(String requestId) {
        WithdrawalRequest request = withdrawalRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Yêu cầu không tồn tại!"));

        String userId = "BUYER".equals(request.getTargetType()) ? request.getUserId() : request.getSellerId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người dùng trên hệ thống!"));

        Map<String, Object> kyc = new HashMap<>();
        
        kyc.put("requestId", request.getId());
        kyc.put("amount", request.getAmount());
        kyc.put("createdAt", request.getCreatedAt());
        kyc.put("bankName", request.getBankName());
        kyc.put("bankAccount", request.getAccountNumber());
        kyc.put("bankHolder", request.getAccountHolder());
        kyc.put("targetType", request.getTargetType());

        kyc.put("sysFullName", user.getFullName());
        kyc.put("sysEmail", user.getEmail());
        kyc.put("sysPhone", user.getPhone());
        kyc.put("joinedDate", user.getCreatedAt());
        kyc.put("accountStatus", user.getAccountStatus());
        
        String idNumber = (user.getIdentityInfo() != null && user.getIdentityInfo().getCccdNumber() != null) 
                ? user.getIdentityInfo().getCccdNumber() : "Chưa cập nhật";
        kyc.put("idNumber", idNumber);

        String sysNameNormalized = (user.getFullName() != null) ? user.getFullName().trim().toUpperCase() : "";
        String bankHolderNormalized = (request.getAccountHolder() != null) ? request.getAccountHolder().trim().toUpperCase() : "";
        
        boolean nameMatch = !sysNameNormalized.isEmpty() && sysNameNormalized.equals(bankHolderNormalized);

        kyc.put("isRisk", !nameMatch);
        kyc.put("riskLevel", nameMatch ? "LOW" : "HIGH");
        kyc.put("riskMessage", nameMatch ? "Họ tên khớp 100% với tài khoản hệ thống." : "CẢNH BÁO: Tên chủ thẻ ngân hàng KHÔNG khớp với tên đăng ký hệ thống!");

        return kyc;
    }

    public double getSellerBalance(String sellerId) {
        return walletRepository.findByUserId(sellerId)
                .map(wallet -> wallet.getBalance() != null ? wallet.getBalance() : 0.0)
                .orElse(0.0);
    }

    @Transactional
    public WithdrawalRequest createWithdrawalRequest(String sellerId, double amount) {
        PlatformConfig config = getConfig();

        if (amount < config.getMinWithdrawalAmount()) {
            throw new RuntimeException("Số tiền rút tối thiểu là " + String.format("%,.0f", config.getMinWithdrawalAmount()) + "₫");
        }

        Wallet wallet = walletRepository.findByUserId(sellerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví của shop!"));

        double currentBalance = wallet.getBalance() != null ? wallet.getBalance() : 0.0;
        if (amount > currentBalance) {
            throw new RuntimeException("Số dư khả dụng không đủ để thực hiện yêu cầu này!");
        }

        long todayCount = withdrawalRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .filter(r -> r.getCreatedAt().toLocalDate().equals(LocalDate.now()))
                .filter(r -> !"REJECTED".equals(r.getStatus()) && !"FAILED".equals(r.getStatus()))
                .count();

        if (todayCount >= config.getMaxDailyWithdrawalsPerShop()) {
            throw new RuntimeException("Bạn đã đạt giới hạn rút tiền " + config.getMaxDailyWithdrawalsPerShop() + " lần/ngày. Vui lòng thử lại vào ngày mai.");
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

        double fee = config.getFlatWithdrawalFee();
        double netAmount = amount - fee;

        // Trừ tiền vào ví
        wallet.setBalance(currentBalance - amount);
        walletRepository.save(wallet);

        WithdrawalRequest request = WithdrawalRequest.builder()
                .targetType("SELLER")
                .sellerId(sellerId)
                .shopName(seller.getShopProfile() != null ? seller.getShopProfile().getShopName() : seller.getFullName())
                .sellerFullName(seller.getFullName())
                .amount(amount)
                .fee(fee)             
                .netAmount(netAmount) 
                .bankName(defaultBank.getBankName())
                .accountNumber(defaultBank.getAccountNumber())
                .accountHolder(defaultBank.getAccountHolder())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        // 🚀 KIỂM TRA NGƯỠNG AUTO-PAYOUT VÀ GỌI MOCK API NGAY LẬP TỨC
        if (config.isAutoPayoutEnabled()) {
            if (amount <= config.getAutoPayoutMaxLimit()) {
                String transferDesc = "AINETSOFT AUTO " + seller.getId().substring(seller.getId().length() - 6).toUpperCase();
                BankTransferProvider.TransferResult result = bankTransferProvider.sendMoney(
                        defaultBank.getAccountNumber(), defaultBank.getBankName(), defaultBank.getAccountHolder(), netAmount, transferDesc
                );
                
                if (result.success()) {
                    request.setStatus("COMPLETED");
                    request.setAdminNote("[AUTO-PAYOUT] " + result.message() + " - TXN: " + result.transactionId());
                    request.setProcessedAt(LocalDateTime.now());
                } else {
                    request.setStatus("FAILED");
                    request.setAdminNote("[AUTO-PAYOUT LỖI] " + result.message());
                    request.setProcessedAt(LocalDateTime.now());
                    
                    // Lỗi Bank -> Hoàn tiền lại ví ngay lập tức
                    wallet.setBalance(wallet.getBalance() + amount);
                    walletRepository.save(wallet);
                }
            } else {
                request.setAdminNote("[HỆ THỐNG] Vượt hạn mức giải ngân tự động (" + String.format("%,.0f", config.getAutoPayoutMaxLimit()) + "đ). Đợi duyệt thủ công.");
            }
        }

        WithdrawalRequest savedRequest = withdrawalRepository.save(request);

        // Xử lý bắn thông báo
        if ("COMPLETED".equals(savedRequest.getStatus())) {
            notificationService.createNotification(sellerId, "✅ Giải ngân thành công", "Hệ thống đã tự động chuyển " + String.format("%,.0f", netAmount) + "đ vào tài khoản ngân hàng của bạn.", "WALLET", savedRequest.getId());
            log.info("🚀 Auto-Payout Success: {} VND for Shop: {}", amount, request.getShopName());
        } else if ("FAILED".equals(savedRequest.getStatus())) {
            notificationService.createNotification(sellerId, "❌ Rút tiền thất bại", "Ngân hàng từ chối giao dịch. Tiền đã được hoàn lại vào ví.", "WALLET", savedRequest.getId());
        } else {
            notifyAdminsNewRequest(savedRequest);
            log.info("🚀 Financial Request Created (Pending): {} VND for Shop: {}", amount, request.getShopName());
        }

        return savedRequest;
    }

    public List<WithdrawalRequest> getSellerHistory(String sellerId) {
        return withdrawalRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
    }

    @Transactional
    public WithdrawalRequest createUserWithdrawalRequest(String userId, double amount) {
        PlatformConfig config = getConfig();

        if (amount < config.getMinWithdrawalAmount()) {
            throw new RuntimeException("Số tiền rút tối thiểu là " + String.format("%,.0f", config.getMinWithdrawalAmount()) + "₫");
        }

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví của bạn!"));

        double currentBalance = wallet.getBalance() != null ? wallet.getBalance() : 0.0;
        if (amount > currentBalance) {
            throw new RuntimeException("Số dư khả dụng trong ví không đủ!");
        }

        long todayCount = withdrawalRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(r -> r.getCreatedAt().toLocalDate().equals(LocalDate.now()))
                .filter(r -> !"REJECTED".equals(r.getStatus()) && !"FAILED".equals(r.getStatus()))
                .count();

        if (todayCount >= config.getMaxDailyWithdrawalsPerShop()) {
            throw new RuntimeException("Bạn đã đạt giới hạn rút tiền " + config.getMaxDailyWithdrawalsPerShop() + " lần/ngày.");
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

        double fee = config.getFlatWithdrawalFee();
        double netAmount = amount - fee;

        wallet.setBalance(currentBalance - amount);
        walletRepository.save(wallet);

        WithdrawalRequest request = WithdrawalRequest.builder()
                .targetType("BUYER")
                .userId(userId)
                .shopName(user.getFullName()) 
                .sellerFullName(user.getFullName())
                .amount(amount)
                .fee(fee)             
                .netAmount(netAmount) 
                .bankName(defaultBank.getBankName())
                .accountNumber(defaultBank.getAccountNumber())
                .accountHolder(defaultBank.getAccountHolder())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        // 🚀 KIỂM TRA NGƯỠNG AUTO-PAYOUT CHO USER
        if (config.isAutoPayoutEnabled()) {
            if (amount <= config.getAutoPayoutMaxLimit()) {
                String transferDesc = "AINETSOFT AUTO " + user.getId().substring(user.getId().length() - 6).toUpperCase();
                BankTransferProvider.TransferResult result = bankTransferProvider.sendMoney(
                        defaultBank.getAccountNumber(), defaultBank.getBankName(), defaultBank.getAccountHolder(), netAmount, transferDesc
                );
                
                if (result.success()) {
                    request.setStatus("COMPLETED");
                    request.setAdminNote("[AUTO-PAYOUT] " + result.message() + " - TXN: " + result.transactionId());
                    request.setProcessedAt(LocalDateTime.now());
                } else {
                    request.setStatus("FAILED");
                    request.setAdminNote("[AUTO-PAYOUT LỖI] " + result.message());
                    request.setProcessedAt(LocalDateTime.now());
                    
                    wallet.setBalance(wallet.getBalance() + amount);
                    walletRepository.save(wallet);
                }
            } else {
                request.setAdminNote("[HỆ THỐNG] Vượt hạn mức giải ngân tự động (" + String.format("%,.0f", config.getAutoPayoutMaxLimit()) + "đ). Đợi duyệt thủ công.");
            }
        }

        WithdrawalRequest savedRequest = withdrawalRepository.save(request);

        if ("COMPLETED".equals(savedRequest.getStatus())) {
            notificationService.createNotification(userId, "✅ Giải ngân thành công", "Hệ thống đã tự động chuyển " + String.format("%,.0f", netAmount) + "đ vào tài khoản ngân hàng.", "WALLET", savedRequest.getId());
        } else if ("FAILED".equals(savedRequest.getStatus())) {
            notificationService.createNotification(userId, "❌ Rút tiền thất bại", "Ngân hàng từ chối giao dịch. Tiền đã được hoàn lại vào ví.", "WALLET", savedRequest.getId());
        } else {
            notifyAdminsNewRequest(savedRequest);
        }

        return savedRequest;
    }

    public List<WithdrawalRequest> getUserHistory(String userId) {
        return withdrawalRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countPendingRequests() {
        return withdrawalRepository.countByStatus("PENDING");
    }

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

        PlatformConfig config = getConfig();
        String targetStatus = status.toUpperCase();
        String finalNote = adminNote != null ? adminNote : "";
        boolean autoPayoutEnabled = config.isAutoPayoutEnabled();

        if ("APPROVED".equals(targetStatus) || "COMPLETED".equals(targetStatus)) {
            if (autoPayoutEnabled && request.getAmount() > config.getAutoPayoutMaxLimit()) {
                targetStatus = "PROCESSING";
                finalNote = finalNote + " | [NGƯỠNG AN TOÀN] Số tiền vượt hạn mức tự động. Vui lòng chuyển khoản thủ công.";
            } else if (autoPayoutEnabled && "PENDING".equals(request.getStatus())) {
                String transferDesc = "AINETSOFT PAYOUT " + request.getId().substring(request.getId().length() - 6).toUpperCase();
                
                double amountToSend = request.getNetAmount() > 0 ? request.getNetAmount() : request.getAmount();

                BankTransferProvider.TransferResult result = bankTransferProvider.sendMoney(
                        request.getAccountNumber(), request.getBankName(), request.getAccountHolder(), amountToSend, transferDesc
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

        if ("REJECTED".equals(targetStatus) || "FAILED".equals(targetStatus)) {
            String targetUserId = "BUYER".equals(request.getTargetType()) ? request.getUserId() : request.getSellerId();
            Wallet wallet = walletRepository.findByUserId(targetUserId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy ví để hoàn tiền!"));
            double current = wallet.getBalance() != null ? wallet.getBalance() : 0.0;
            wallet.setBalance(current + request.getAmount());
            walletRepository.save(wallet);
            log.info("Refunded {} to Wallet {} due to status: {}", request.getAmount(), targetUserId, targetStatus);
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

    public byte[] exportToExcel(String status) throws IOException {
        List<WithdrawalRequest> list = (status == null || "ALL".equalsIgnoreCase(status)) 
                ? withdrawalRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                : withdrawalRepository.findByStatus(status.toUpperCase(), Pageable.unpaged()).getContent();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Withdrawals");
            String[] headers = {"Mã GD", "Loại", "Người yêu cầu", "Số tiền yêu cầu", "Phí", "Thực chi", "Ngân hàng", "STK", "Trạng thái", "Ngày tạo"};
            Row hRow = sheet.createRow(0);
            for(int i=0; i<headers.length; i++) hRow.createCell(i).setCellValue(headers[i]);

            int rowIdx = 1;
            for (WithdrawalRequest req : list) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(req.getId() != null ? req.getId() : "");
                row.createCell(1).setCellValue(req.getTargetType() != null ? req.getTargetType() : "");
                row.createCell(2).setCellValue(req.getShopName() != null ? req.getShopName() : "");
                row.createCell(3).setCellValue(req.getAmount());
                row.createCell(4).setCellValue(req.getFee());
                row.createCell(5).setCellValue(req.getNetAmount());
                row.createCell(6).setCellValue(req.getBankName() != null ? req.getBankName() : "");
                row.createCell(7).setCellValue(req.getAccountNumber() != null ? req.getAccountNumber() : "");
                row.createCell(8).setCellValue(req.getStatus() != null ? req.getStatus() : "");
                row.createCell(9).setCellValue(req.getCreatedAt() != null ? req.getCreatedAt().toString() : "");
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void notifyAdminsNewRequest(WithdrawalRequest request) {
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
                    request.getId()
                );
            });
        } catch (Exception e) {
            log.error("Failed to notify admins: {}", e.getMessage());
        }
    }
}
