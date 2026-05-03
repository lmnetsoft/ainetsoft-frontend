package com.ainetsoft.service;

import com.ainetsoft.model.Voucher;
import com.ainetsoft.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;

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
                .filter(v -> v.getSellerId() == null) // Voucher sàn không thuộc về shop nào
                .filter(Voucher::isActive)
                .filter(v -> LocalDateTime.now().isAfter(v.getValidFrom()) && LocalDateTime.now().isBefore(v.getValidUntil()))
                .collect(Collectors.toList());
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
}