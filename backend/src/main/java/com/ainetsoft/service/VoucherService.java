package com.ainetsoft.service;

import com.ainetsoft.model.Voucher;
import com.ainetsoft.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;

    // --- Lấy danh sách Voucher của một Shop ---
    public List<Voucher> getSellerVouchers(String sellerId) {
        return voucherRepository.findBySellerId(sellerId);
    }

    // --- Tạo Voucher Mới ---
    @Transactional
    public Voucher createVoucher(Voucher payload) {
        // Kiểm tra mã Code đã tồn tại chưa
        if (voucherRepository.findByCode(payload.getCode()).isPresent()) {
            throw new RuntimeException("Mã Voucher này đã tồn tại trong hệ thống! Vui lòng chọn mã khác.");
        }

        // Validate ngày tháng
        if (payload.getValidUntil().isBefore(payload.getValidFrom())) {
            throw new RuntimeException("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!");
        }
        if (payload.getValidUntil().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Thời gian kết thúc không được ở trong quá khứ!");
        }

        // Khởi tạo các giá trị mặc định
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

        // Bảo mật: Chỉ chủ sở hữu mới được phép tắt voucher của họ (trừ khi là Admin)
        if (voucher.getSellerId() != null && !voucher.getSellerId().equals(sellerId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa voucher này!");
        }

        voucher.setActive(false);
        return voucherRepository.save(voucher);
    }
}