package com.ainetsoft.controller;

import com.ainetsoft.service.shipping.ShippingProvider;
import com.ainetsoft.service.shipping.ShippingProviderFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final ShippingProviderFactory shippingFactory;

    @GetMapping("/provinces")
    public ResponseEntity<?> getProvinces() {
        // Tương lai có thể dùng GHTK, hiện tại dùng chuẩn GHN làm hệ quy chiếu địa lý
        ShippingProvider provider = shippingFactory.getProvider("GHN"); 
        return ResponseEntity.ok(provider.getProvinces());
    }

    @GetMapping("/districts/{provinceId}")
    public ResponseEntity<?> getDistricts(@PathVariable Integer provinceId) {
        ShippingProvider provider = shippingFactory.getProvider("GHN");
        return ResponseEntity.ok(provider.getDistricts(provinceId));
    }

    @GetMapping("/wards/{districtId}")
    public ResponseEntity<?> getWards(@PathVariable Integer districtId) {
        ShippingProvider provider = shippingFactory.getProvider("GHN");
        return ResponseEntity.ok(provider.getWards(districtId));
    }
}
