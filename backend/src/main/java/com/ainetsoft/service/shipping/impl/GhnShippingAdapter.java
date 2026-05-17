package com.ainetsoft.service.shipping.impl;

import com.ainetsoft.model.User;
import com.ainetsoft.service.shipping.ShippingProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GhnShippingAdapter implements ShippingProvider {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${shipping.ghn.base-url}")
    private String baseUrl;

    @Value("${shipping.ghn.token}")
    private String token;

    @Value("${shipping.ghn.test-shop-id}")
    private String defaultShopId;

    @Override
    public String getProviderCode() {
        return "GHN";
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", token.replace("\"", "").trim());
        return headers;
    }

    @Override
    public String registerShop(User user, User.ShopProfile shopProfile, User.AddressInfo pickupAddress) {
        String url = baseUrl + "/shop/register";

        Map<String, Object> body = new HashMap<>();
        // Trong môi trường thực tế, District ID và Ward Code phải được lấy từ Master Data
        body.put("district_id", pickupAddress.getDistrictId() != null ? pickupAddress.getDistrictId() : 1452); 
        body.put("ward_code", pickupAddress.getWardCode() != null ? pickupAddress.getWardCode() : "21012"); 
        body.put("name", shopProfile.getShopName() != null ? shopProfile.getShopName() : user.getFullName());
        body.put("phone", pickupAddress.getPhone() != null ? pickupAddress.getPhone() : shopProfile.getBusinessPhone());
        body.put("address", pickupAddress.getDetail() != null ? pickupAddress.getDetail() : "Chưa cập nhật");

        System.out.println("=================================================");
        System.out.println("🚀 [LOGISTICS] AUTO-PROVISIONING GHN SHOP");
        System.out.println("📦 Payload: " + body.toString());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                String newShopId = data.get("shop_id").toString();
                System.out.println("✅ [LOGISTICS] TẠO SHOP GHN THÀNH CÔNG! MÃ SHOP: " + newShopId);
                return newShopId;
            }
        } catch (HttpStatusCodeException httpException) {
            System.err.println("❌ [LOGISTICS] GHN TỪ CHỐI TẠO SHOP: " + httpException.getResponseBodyAsString());
        } catch (Exception e) {
            System.err.println("❌ [LOGISTICS] LỖI HỆ THỐNG KHI TẠO SHOP: " + e.getMessage());
        }
        return null;
    }

    @Override
    public Double calculateFee(Integer toDistrictId, String toWardCode, Integer weightInGram) {
        String url = baseUrl + "/shipping-order/fee";

        Map<String, Object> body = new HashMap<>();
        body.put("shop_id", Integer.parseInt(defaultShopId.replace("\"", "").trim())); 
        body.put("to_district_id", toDistrictId);
        body.put("to_ward_code", toWardCode);
        body.put("weight", weightInGram);
        body.put("service_type_id", 2);

        HttpHeaders headers = createHeaders();
        headers.set("ShopId", defaultShopId.replace("\"", "").trim());
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                return Double.valueOf(data.get("total").toString());
            }
        } catch (Exception e) {
            System.err.println("❌ [LOGISTICS] Lỗi hệ thống: " + e.getMessage());
        }
        return 30000.0;
    }

    // 🚀 MASTER DATA PROXY CALLS - FIXED URL PATH & METHOD TYPE
    @Override
    public List<Map<String, Object>> getProvinces() {
        String url = baseUrl.replace("/v2", "") + "/master-data/province";
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            return (List<Map<String, Object>>) response.getBody().get("data");
        } catch (Exception e) {
            System.err.println("❌ Lỗi gọi GHN Province: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    public List<Map<String, Object>> getDistricts(Integer provinceId) {
        String url = baseUrl.replace("/v2", "") + "/master-data/district?province_id=" + provinceId;
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            return (List<Map<String, Object>>) response.getBody().get("data");
        } catch (Exception e) {
            System.err.println("❌ Lỗi gọi GHN District: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    public List<Map<String, Object>> getWards(Integer districtId) {
        String url = baseUrl.replace("/v2", "") + "/master-data/ward?district_id=" + districtId;
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            return (List<Map<String, Object>>) response.getBody().get("data");
        } catch (Exception e) {
            System.err.println("❌ Lỗi gọi GHN Ward: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}
