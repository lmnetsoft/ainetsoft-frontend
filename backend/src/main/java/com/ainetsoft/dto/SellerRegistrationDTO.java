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
 * Updated to support Hộ kinh doanh & Công ty requirements (Step 3).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerRegistrationDTO {

    // --- STEP 1: THÔNG TIN SHOP & LIÊN HỆ ---

    @NotBlank(message = "Tên shop không được để trống")
    private String shopName;

    @NotBlank(message = "Email liên hệ không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    private String phone; 

    @NotEmpty(message = "Phải có ít nhất một địa chỉ lấy hàng")
    @Size(max = 2, message = "Chỉ cho phép tối đa 2 địa chỉ lấy hàng")
    private List<AddressDTO> stockAddresses;


    // --- STEP 2: CÀI ĐẶT VẬN CHUYỂN ---

    @NotEmpty(message = "Vui lòng kích hoạt ít nhất một phương thức vận chuyển")
    private Map<String, Boolean> shippingMethods;


    // --- STEP 3: THÔNG TIN THUẾ (Hộ kinh doanh / Công ty support) ---

    @NotBlank(message = "Loại hình kinh doanh không được để trống")
    private String businessType; // INDIVIDUAL, HOUSEHOLD, ENTERPRISE

    // New: Only required if businessType is HOUSEHOLD or ENTERPRISE
    private String companyName; 

    @NotBlank(message = "Địa chỉ đăng ký kinh doanh không được để trống")
    private String registeredAddress;

    // Updated: Changed to List to support "Thêm Email (1/5)"
    @NotEmpty(message = "Phải có ít nhất một email nhận hóa đơn")
    @Size(max = 5, message = "Tối đa 5 email nhận hóa đơn")
    private List<@Email(message = "Định dạng email hóa đơn không hợp lệ") String> invoiceEmails;

    @NotBlank(message = "Mã số thuế không được để trống")
    @Pattern(regexp = "^\\d{10}(\\d{3})?$", message = "Mã số thuế không hợp lệ (10 hoặc 13 chữ số)")
    private String taxCode;


    // --- STEP 4: THÔNG TIN ĐỊNH DANH (CCCD) ---

    @NotBlank(message = "Số CCCD không được để trống")
    @Pattern(regexp = "^\\d{12}$", message = "Số CCCD phải bao gồm 12 chữ số")
    private String cccdNumber;


    // --- BANKING INFORMATION ---

    @NotBlank(message = "Tên ngân hàng không được để trống")
    private String bankName;

    @NotBlank(message = "Số tài khoản không được để trống")
    private String accountNumber;

    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    private String accountHolder;
}