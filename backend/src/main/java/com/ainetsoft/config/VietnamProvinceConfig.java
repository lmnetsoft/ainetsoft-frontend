package com.ainetsoft.config;

import java.util.Arrays;
import java.util.List;

public class VietnamProvinceConfig {
    public static final List<String> APPROVED_PROVINCES = Arrays.asList(
        "Hà Nội",
        "Tuyên Quang", // (Hà Giang + Tuyên Quang)
        "Lào Cai",     // (Yên Bái + Lào Cai)
        "Thái Nguyên", // (Bắc Kạn + Thái Nguyên)
        "Phú Thọ",     // (Vĩnh Phúc + Hòa Bình + Phú Thọ)
        "Bắc Ninh",    // (Bắc Giang + Bắc Ninh)
        "Hưng Yên",    // (Thái Bình + Hưng Yên)
        "Hải Phòng",   // (Hải Dương + Hải Phòng)
        "Ninh Bình",   // (Hà Nam + Nam Định + Ninh Bình)
        "Quảng Trị",   // (Quảng Bình + Quảng Trị)
        "Đà Nẵng",     // (Quảng Nam + Đà Nẵng)
        "Quảng Ngãi",  // (Kon Tum + Quảng Ngãi)
        "Gia Lai",     // (Bình Định + Gia Lai)
        "Khánh Hòa",   // (Ninh Thuận + Khánh Hòa)
        "Lâm Đồng",    // (Đắk Nông + Bình Thuận + Lâm Đồng)
        "Đắk Lắk",     // (Phú Yên + Đắk Lắk)
        "TP.HCM",      // Expanded (TP.HCM + Bình Dương + Bà Rịa–Vũng Tàu)
        "Đồng Nai",    // (Đồng Nai + Bình Phước)
        "Tây Ninh",    // (Tây Ninh + Long An)
        "Cần Thơ",     // (Cần Thơ + Sóc Trăng + Hậu Giang)
        "Vĩnh Long",   // (Bến Tre + Vĩnh Long + Trà Vinh)
        "Đồng Tháp",   // (Tiền Giang + Đồng Tháp)
        "Cà Mau",      // (Bạc Liêu + Cà Mau)
        "An Giang",    // (Kiên Giang + An Giang)
        "Huế", "Lai Châu", "Điện Biên", "Sơn La", "Lạng Sơn", 
        "Quảng Ninh", "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Cao Bằng"
    );

    public static boolean isValid(String provinceName) {
        return APPROVED_PROVINCES.contains(provinceName);
    }
}