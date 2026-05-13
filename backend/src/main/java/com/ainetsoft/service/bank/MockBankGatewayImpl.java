package com.ainetsoft.service.bank;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@Profile("dev") // 🚀 Chỉ chạy ở môi trường Dev
public class MockBankGatewayImpl implements BankTransferProvider {

    @Override
    public TransferResult sendMoney(String accountNumber, String bankName, String accountHolder, double amount, String description) {
        log.info("🌐 [MOCK BANK GATEWAY] Initiating transfer...");
        log.info("➡️ To: {} - {} ({})", bankName, accountNumber, accountHolder);
        log.info("💰 Amount: {} VND", amount);
        log.info("📝 Description: {}", description);

        // Giả lập độ trễ mạng (Network Latency) khoảng 1.5 giây
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Sinh mã giao dịch ngẫu nhiên (Mock Transaction ID)
        String txnId = "FT" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Giả lập Logic báo lỗi (Fail Case) nếu số tài khoản chứa "9999"
        if (accountNumber != null && accountNumber.contains("9999")) {
            log.error("❌ [MOCK BANK GATEWAY] Transfer FAILED: Tài khoản bị khóa hoặc không tồn tại.");
            // 🚀 Đã sửa thứ tự: (success, transactionId, message)
            return new TransferResult(false, null, "Lỗi từ NH: Tài khoản không hợp lệ (Code: ERR9999)");
        }

        // Giả lập Thành công (Success Case)
        log.info("✅ [MOCK BANK GATEWAY] Transfer SUCCESS! TXN_ID: {}", txnId);
        // 🚀 Đã sửa thứ tự: (success, transactionId, message)
        return new TransferResult(true, txnId, "Chuyển khoản liên ngân hàng thành công");
    }
}
