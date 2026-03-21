package com.ainetsoft.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
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

    // --- SECTION 1: LIÊN HỆ & BANKING (Merged) ---

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
        regexp = "^(0|\\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\\d{7}$",
        message = "Số điện thoại không đúng định dạng nhà mạng Việt Nam"
    )
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
    private List<AddressDTO> stockAddresses;

    // --- SECTION 3: CÀI ĐẶT VẬN CHUYỂN (Dynamic) ---

    /**
     * Key: ID or Code of the Shipping Method (e.g., from ShippingMethod model)
     * Value: true (Enabled) / false (Disabled)
     */
    @NotEmpty(message = "Vui lòng kích hoạt ít nhất một phương thức vận chuyển")
    private Map<String, Boolean> shippingMethods;

    // --- SECTION 4: THÔNG TIN CỬA HÀNG & ĐỊNH DANH ---

    @NotBlank(message = "Số CCCD không được để trống")
    @Pattern(regexp = "^\\d{12}$", message = "Số CCCD phải bao gồm 12 chữ số")
    private String cccdNumber;

    @NotBlank(message = "Tên shop không được để trống")
    private String shopName;

    private String taxCode; // Optional as per requirement
}