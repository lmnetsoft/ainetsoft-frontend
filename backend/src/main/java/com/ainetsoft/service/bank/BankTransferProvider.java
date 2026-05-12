package com.ainetsoft.service.bank;

public interface BankTransferProvider {
    /**
     * Hàm thực hiện chuyển tiền tự động ra ngoài (Payout)
     */
    TransferResult sendMoney(String accountNumber, String bankName, String accountHolder, double amount, String description);

    // Record dùng để chuẩn hóa kết quả trả về từ mọi ngân hàng
    record TransferResult(boolean success, String transactionId, String message) {}
}
