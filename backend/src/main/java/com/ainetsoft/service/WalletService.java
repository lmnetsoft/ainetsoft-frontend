package com.ainetsoft.service;

import com.ainetsoft.model.Voucher;
import com.ainetsoft.model.Wallet;
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
public class WalletService {

    private final WalletRepository walletRepository;
    private final VoucherRepository voucherRepository;
    private final NotificationService notificationService;

    // --- Lấy Ví của User (Tự động tạo nếu chưa có) ---
    public Wallet getOrCreateWallet(String userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            Wallet newWallet = Wallet.builder()
                    .userId(userId)
                    .balance(0.0) // 🚀 THÊM SỐ DƯ VND KHẢ DỤNG
                    .escrowBalance(0.0) // 🚀 THÊM SỐ DƯ TẠM GIỮ (ESCROW)
                    .coinBalance(0.0)
                    .savedVoucherIds(new ArrayList<>())
                    .updatedAt(LocalDateTime.now())
                    .build();
            return walletRepository.save(newWallet);
        });
    }

    // --- Lưu Voucher vào Kho ---
    @Transactional
    public Wallet saveVoucherToWallet(String userId, String voucherId) {
        Wallet wallet = getOrCreateWallet(userId);
        
        voucherRepository.findById(voucherId)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại!"));

        if (wallet.getSavedVoucherIds() == null) {
            wallet.setSavedVoucherIds(new ArrayList<>());
        }

        if (!wallet.getSavedVoucherIds().contains(voucherId)) {
            wallet.getSavedVoucherIds().add(voucherId);
            wallet.setUpdatedAt(LocalDateTime.now());
            walletRepository.save(wallet);
        } else {
            throw new RuntimeException("Bạn đã lưu voucher này rồi!");
        }

        return wallet;
    }

    public List<Voucher> getSavedVouchersDetailed(String userId) {
        Wallet wallet = getOrCreateWallet(userId);
        List<String> voucherIds = wallet.getSavedVoucherIds();
        
        if (voucherIds == null || voucherIds.isEmpty()) {
            return new ArrayList<>();
        }

        return voucherIds.stream()
                .map(voucherRepository::findById)
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .collect(Collectors.toList());
    }

    @Transactional
    public Wallet removeVoucherFromWallet(String userId, String voucherId) {
        Wallet wallet = getOrCreateWallet(userId);
        if (wallet.getSavedVoucherIds() != null) {
            wallet.getSavedVoucherIds().remove(voucherId);
            wallet.setUpdatedAt(LocalDateTime.now());
            walletRepository.save(wallet);
        }
        return wallet;
    }

    @Transactional
    public Wallet addCoins(String userId, double amount) {
        Wallet wallet = getOrCreateWallet(userId);
        wallet.setCoinBalance(wallet.getCoinBalance() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        return walletRepository.save(wallet);
    }

    @Transactional
    public Wallet deductCoins(String userId, double amount) {
        Wallet wallet = getOrCreateWallet(userId);
        if (wallet.getCoinBalance() < amount) {
            throw new RuntimeException("Số dư AiNetsoft Xu không đủ!");
        }
        wallet.setCoinBalance(wallet.getCoinBalance() - amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        return walletRepository.save(wallet);
    }

    public Map<String, Object> getSystemCoinStats() {
        double totalBalance = walletRepository.findAll().stream()
                .mapToDouble(Wallet::getCoinBalance)
                .sum();
        
        long activeWallets = walletRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCoinsInCirculation", totalBalance);
        stats.put("totalWallets", activeWallets);
        return stats;
    }

    @Transactional
    public void adjustUserCoins(String userId, double amount, String reason, String adminName) {
        Wallet wallet = getOrCreateWallet(userId);
        wallet.setCoinBalance(wallet.getCoinBalance() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        String title = amount > 0 ? "🎉 Bạn nhận được Xu từ hệ thống" : "Tài khoản Xu bị điều chỉnh";
        notificationService.createNotification(userId, title, reason, "WALLET", null);
    }

    // 🚀 THÊM MỚI: QUẢN LÝ TIỀN VND THẬT (ESCROW VÀ SỐ DƯ)

    @Transactional
    public void addEscrow(String userId, double amount) {
        Wallet wallet = getOrCreateWallet(userId);
        double currentEscrow = wallet.getEscrowBalance() != null ? wallet.getEscrowBalance() : 0.0;
        wallet.setEscrowBalance(currentEscrow + amount);
        walletRepository.save(wallet);
    }

    @Transactional
    public void releaseEscrowToBalance(String userId, double amount) {
        Wallet wallet = getOrCreateWallet(userId);
        double currentEscrow = wallet.getEscrowBalance() != null ? wallet.getEscrowBalance() : 0.0;
        double currentBalance = wallet.getBalance() != null ? wallet.getBalance() : 0.0;
        
        if (currentEscrow >= amount) {
            wallet.setEscrowBalance(currentEscrow - amount);
            wallet.setBalance(currentBalance + amount);
            walletRepository.save(wallet);
        } else {
            log.error("Lỗi giải tỏa quỹ: Số dư tạm giữ ({}) nhỏ hơn số tiền yêu cầu ({})", currentEscrow, amount);
        }
    }
}