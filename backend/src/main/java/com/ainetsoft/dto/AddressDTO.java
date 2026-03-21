package com.ainetsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for Address information.
 * Fully compliant with the 2026 Administrative Reform:
 * Tỉnh/Thành phố -> Phường/Xã -> Ấp/Thôn/Tổ
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressDTO {
    private String fullName;      // Tên người nhận hoặc người phụ trách kho
    private String phoneNumber;   // Số điện thoại liên lạc tại kho
    private String province;      // Tỉnh hoặc Thành phố trực thuộc trung ương
    private String ward;          // Phường hoặc Xã
    private String hamlet;        // Ấp, Thôn, Bản hoặc Tổ dân phố (Thay thế cấp Quận/Huyện)
    private String detailAddress; // Địa chỉ chi tiết: Số nhà, tên đường...
    private String latitude;      // Tọa độ Vĩ độ từ tính năng "Định vị GPS"
    private String longitude;     // Tọa độ Kinh độ từ tính năng "Định vị GPS"
    private boolean isDefault;    // Đánh dấu nếu là kho hàng mặc định
}