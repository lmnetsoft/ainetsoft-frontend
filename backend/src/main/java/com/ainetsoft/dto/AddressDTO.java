package com.ainetsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressDTO {
    private String fullName;
    private String phoneNumber;
    private String province;
    private String district;
    private String ward;
    
    // 🚀 FIXED: Bổ sung trường hamlet bị thiếu
    private String hamlet; 
    
    private String detailAddress;
    
    // 🚀 MASTER DATA TỪ ĐỐI TÁC VẬN CHUYỂN
    private Integer districtId;
    private String wardCode;
    
    private String latitude;
    private String longitude;
    private boolean isDefault;
}
