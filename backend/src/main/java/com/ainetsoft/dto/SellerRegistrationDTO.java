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
 * Banking fields are now optional to allow successful submission at Step 4.
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

    // --- STEP 3: THÔNG TIN THUẾ ---
    @NotBlank(message = "Loại hình kinh doanh không được để trống")
    private String businessType; 

    private String companyName; 

    @NotBlank(message = "Địa chỉ đăng ký kinh doanh không được để trống")
    private String registeredAddress;

    @NotEmpty(message = "Phải có ít nhất một email nhận hóa đơn")
    @Size(max = 5, message = "Tối đa 5 email nhận hóa đơn")
    private List<@Email(message = "Định dạng email hóa đơn không hợp lệ") String> invoiceEmails;

    @NotBlank(message = "Mã số thuế không được để trống")
    @Pattern(regexp = "^\\d{10}(\\d{3})?$", message = "Mã số thuế không hợp lệ (10 hoặc 13 chữ số)")
    private String taxCode;

    // --- STEP 4: THÔNG TIN ĐỊNH DANH (CCCD / HỘ CHIẾU) ---
    private String identityType;

    @NotBlank(message = "Số định danh không được để trống")
    // UPDATED: Regex now allows 12 digits (CCCD) OR 1 Letter + 7-8 digits (VN Passport)
    @Pattern(regexp = "^(\\d{12}|[A-Z]\\d{7,8})$", message = "Số CCCD (12 chữ số) hoặc Hộ chiếu (Vd: G1234567) không hợp lệ")
    private String cccdNumber;

    // --- BANKING INFORMATION (Fix: Validation removed to prevent 400 error) ---
    private String bankName;
    private String accountNumber;
    private String accountHolder;
}