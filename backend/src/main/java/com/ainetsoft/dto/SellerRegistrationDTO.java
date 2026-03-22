package com.ainetsoft.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Data Transfer Object for Seller Registration.
 * Merges Contact, Banking, Multiple Warehouses, and Dynamic Shipping.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerRegistrationDTO {

    // --- SECTION 1: LIÊN HỆ & BANKING ---

    // REMOVED @NotBlank: Redundant phone field in main UI step
    private String phone;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Tên ngân hàng không được để trống")
    private String bankName;

    @NotBlank(message = "Số tài khoản không được để trống")
    private String accountNumber;

    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    private String accountHolder;

    // --- SECTION 2: ĐỊA CHỈ LẤY HÀNG (Multiple Stocks) ---

    @NotEmpty(message = "Phải có ít nhất một địa chỉ lấy hàng")
    @Size(max = 2, message = "Chỉ cho phép tối đa 2 địa chỉ lấy hàng") // LIMIT: Max 2 addresses
    private List<AddressDTO> stockAddresses;

    // --- SECTION 3: CÀI ĐẶT VẬN CHUYỂN (Dynamic) ---

    @NotEmpty(message = "Vui lòng kích hoạt ít nhất một phương thức vận chuyển")
    private Map<String, Boolean> shippingMethods;

    // --- SECTION 4: THÔNG TIN CỬA HÀNG & ĐỊNH DANH ---

    @NotBlank(message = "Số CCCD không được để trống")
    @Pattern(regexp = "^\\d{12}$", message = "Số CCCD phải bao gồm 12 chữ số")
    private String cccdNumber;

    @NotBlank(message = "Tên shop không được để trống")
    private String shopName;

    private String taxCode; // Optional
}