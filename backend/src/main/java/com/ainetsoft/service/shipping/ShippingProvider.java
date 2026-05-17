package com.ainetsoft.service.shipping;

import com.ainetsoft.model.User;
import java.util.List;
import java.util.Map;

public interface ShippingProvider {
    /**
     * Mã định danh của nhà vận chuyển (VD: "GHN", "GHTK")
     */
    String getProviderCode();

    /**
     * Đăng ký Shop mới trên hệ thống đối tác và trả về Shop ID của họ
     */
    String registerShop(User user, User.ShopProfile shopProfile, User.AddressInfo pickupAddress);

    /**
     * Tính toán phí vận chuyển
     */
    Double calculateFee(Integer toDistrictId, String toWardCode, Integer weightInGram);

    // 🚀 MASTER DATA PROXY: Chuyên lấy dữ liệu địa giới hành chính
    List<Map<String, Object>> getProvinces();
    List<Map<String, Object>> getDistricts(Integer provinceId);
    List<Map<String, Object>> getWards(Integer districtId);
}
