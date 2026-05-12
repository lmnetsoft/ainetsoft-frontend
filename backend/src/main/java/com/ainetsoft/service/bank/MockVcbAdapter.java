package com.ainetsoft.service.bank;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
public class MockVcbAdapter implements BankTransferProvider {

    @Override
    public TransferResult sendMoney(String accountNumber, String bankName, String accountHolder, double amount, String description) {
        log.info("==================================================");
        log.info("🏦 [MOCK VCB API] KẾT NỐI HỆ THỐNG NGÂN HÀNG...");
        log.info("🏦 Ngân hàng đích : {}", bankName);
        log.info("🏦 Chủ tài khoản  : {}", accountHolder);
        log.info("🏦 Số tài khoản   : {}", accountNumber);
        log.info("🏦 Số tiền        : {} VND", amount);
        log.info("🏦 Nội dung CK    : {}", description);
        log.info("==================================================");
        
        // Giả lập độ trễ mạng khi kết nối với máy chủ ngân hàng (1.5 giây)
        try {
            Thread.sleep(1500);
        } catch (InterruptedException ignored) {}
        
        // Giả lập Business Logic: Báo lỗi nếu rút số tiền quá lớn (VD: > 500 triệu)
        if (amount > 500000000) {
            log.error("❌ [MOCK VCB API] TỪ CHỐI: Vượt quá hạn mức giao dịch trong ngày!");
            return new TransferResult(false, null, "Ngân hàng từ chối: Vượt quá hạn mức 500tr/giao dịch");
        }

        // Tạo mã giao dịch giả lập giống format của Vietcombank
        String mockTransactionId = "MBVCB" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        log.info("✅ [MOCK VCB API] GIAO DỊCH THÀNH CÔNG! Mã GD: {}", mockTransactionId);
        
        return new TransferResult(true, mockTransactionId, "Chuyển khoản tự động thành công qua Mock VCB");
    }
}
