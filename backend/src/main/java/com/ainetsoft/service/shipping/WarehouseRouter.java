package com.ainetsoft.service.shipping;

import com.ainetsoft.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class WarehouseRouter {

    public User.AddressInfo findOptimalWarehouse(List<User.AddressInfo> sellerAddresses, User.AddressInfo buyerAddress) {
        if (sellerAddresses == null || sellerAddresses.isEmpty()) return null;

        // Nếu Seller chỉ có 1 kho, không cần tính toán
        if (sellerAddresses.size() == 1) return sellerAddresses.get(0);

        // Nếu có tọa độ GPS, tính toán khoảng cách
        if (buyerAddress != null && buyerAddress.getLatitude() != null && buyerAddress.getLongitude() != null) {
            try {
                double buyerLat = Double.parseDouble(buyerAddress.getLatitude());
                double buyerLng = Double.parseDouble(buyerAddress.getLongitude());

                User.AddressInfo nearestWarehouse = sellerAddresses.get(0);
                double minDistance = Double.MAX_VALUE;

                for (User.AddressInfo warehouse : sellerAddresses) {
                    if (warehouse.getLatitude() != null && warehouse.getLongitude() != null) {
                        double wLat = Double.parseDouble(warehouse.getLatitude());
                        double wLng = Double.parseDouble(warehouse.getLongitude());
                        
                        double distance = calculateHaversineDistance(buyerLat, buyerLng, wLat, wLng);
                        log.info("📍 Xét kho [{}]: Cách khách hàng {} km", warehouse.getDistrict(), String.format("%.2f", distance));
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestWarehouse = warehouse;
                        }
                    }
                }
                log.info("🎯 [PHASE 2 - ROUTING SUCCESS] Đã chốt kho xuất hàng gần nhất: {}", nearestWarehouse.getDetail());
                return nearestWarehouse;
            } catch (Exception e) {
                log.error("❌ Lỗi tính toán định tuyến GPS: {}", e.getMessage());
            }
        }

        // Fallback: Mất tín hiệu GPS, lấy kho mặc định
        log.warn("⚠️ [ROUTING FALLBACK] Không có GPS, áp dụng kho mặc định.");
        return sellerAddresses.stream().filter(User.AddressInfo::isDefault).findFirst().orElse(sellerAddresses.get(0));
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS_KM = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
