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
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final WalletRepository walletRepository; 

    // --- SELLER: Lấy toàn bộ danh sách Voucher của mình (Cả hết hạn và đang chạy) ---
    public List<Voucher> getSellerVouchers(String sellerId) {
        return voucherRepository.findBySellerId(sellerId);
    }

    // 🚀 NEW (BUYER): Lấy danh sách Voucher Đang Hoạt Động của 1 Shop cụ thể
    public List<Voucher> getActiveVouchersByShop(String sellerId) {
        return voucherRepository.findBySellerId(sellerId).stream()
                .filter(Voucher::isActive)
                .filter(v -> LocalDateTime.now().isAfter(v.getValidFrom()) && LocalDateTime.now().isBefore(v.getValidUntil()))
                .collect(Collectors.toList());
    }

    // 🚀 NEW (BUYER): Lấy danh sách Voucher Toàn Sàn (Của Admin tạo, sellerId = null)
    public List<Voucher> getActivePlatformVouchers() {
        return voucherRepository.findAll().stream()
                .filter(v -> v.getSellerId() == null) 
                .filter(Voucher::isActive)
                .filter(v -> LocalDateTime.now().isAfter(v.getValidFrom()) && LocalDateTime.now().isBefore(v.getValidUntil()))
                .collect(Collectors.toList());
    }

    // 🚀 BẢN VÁ (BUYER): Logic lưu Voucher vào Ví
    @Transactional
    public void saveVoucherToWallet(String voucherId, String userId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại!"));

        if (!voucher.isActive() || LocalDateTime.now().isAfter(voucher.getValidUntil())) {
            throw new RuntimeException("Mã giảm giá này đã hết hạn hoặc không còn hoạt động!");
        }

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví của người dùng!"));

        if (wallet.getSavedVoucherIds() == null) {
            wallet.setSavedVoucherIds(new ArrayList<>());
        }

        if (wallet.getSavedVoucherIds().contains(voucherId)) {
            throw new RuntimeException("Bạn đã lưu mã giảm giá này vào ví rồi!");
        }

        wallet.getSavedVoucherIds().add(voucherId);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
    }

    // 🚀 BẢN VÁ (BUYER): Lấy toàn bộ Voucher đã lưu trong Ví của khách hàng
    public List<Voucher> getMySavedVouchers(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví của người dùng!"));

        if (wallet.getSavedVoucherIds() == null || wallet.getSavedVoucherIds().isEmpty()) {
            return new ArrayList<>();
        }

        // Lấy tất cả thông tin Voucher dựa trên danh sách ID trong Ví
        List<Voucher> savedVouchers = new ArrayList<>();
        voucherRepository.findAllById(wallet.getSavedVoucherIds()).forEach(savedVouchers::add);
        
        return savedVouchers;
    }

    // --- Tạo Voucher Mới ---
    @Transactional
    public Voucher createVoucher(Voucher payload) {
        if (voucherRepository.findByCode(payload.getCode()).isPresent()) {
            throw new RuntimeException("Mã Voucher này đã tồn tại trong hệ thống! Vui lòng chọn mã khác.");
        }
        if (payload.getValidUntil().isBefore(payload.getValidFrom())) {
            throw new RuntimeException("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!");
        }
        if (payload.getValidUntil().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Thời gian kết thúc không được ở trong quá khứ!");
        }

        payload.setUsedCount(0);
        payload.setActive(true);
        payload.setCreatedAt(LocalDateTime.now());

        return voucherRepository.save(payload);
    }

    // --- Kết thúc sớm Voucher ---
    @Transactional
    public Voucher deactivateVoucher(String voucherId, String sellerId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại!"));

        if (voucher.getSellerId() != null && !voucher.getSellerId().equals(sellerId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa voucher này!");
        }

        voucher.setActive(false);
        return voucherRepository.save(voucher);
    }

    // ==========================================
    // 👑 ADMIN: QUẢN LÝ VOUCHER TOÀN SÀN
    // ==========================================
    
    public List<Voucher> getAllPlatformVouchers() {
        return voucherRepository.findAll().stream()
                .filter(v -> v.getSellerId() == null)
                .sorted((v1, v2) -> {
                    if (v1.getCreatedAt() == null || v2.getCreatedAt() == null) return 0;
                    return v2.getCreatedAt().compareTo(v1.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Voucher deactivatePlatformVoucher(String voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại!"));
        voucher.setActive(false);
        return voucherRepository.save(voucher);
    }
}