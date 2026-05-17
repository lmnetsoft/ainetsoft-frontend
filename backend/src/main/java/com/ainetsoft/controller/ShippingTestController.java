package com.ainetsoft.controller;

import com.ainetsoft.service.shipping.impl.GhnShippingAdapter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/shipping-test")
@RequiredArgsConstructor
public class ShippingTestController {

    private final GhnShippingAdapter ghnShippingAdapter;

    @GetMapping("/fee")
    public ResponseEntity<?> testCalculateFee(
            @RequestParam(defaultValue = "1442") Integer toDistrictId, // Mặc định: Quận 1, TP.HCM
            @RequestParam(defaultValue = "20101") String toWardCode,   // Mặc định: Phường Bến Nghé
            @RequestParam(defaultValue = "500") Integer weightGram) {  // Mặc định: 500 gram

        try {
            Double fee = ghnShippingAdapter.calculateFee(toDistrictId, toWardCode, weightGram);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("provider", "GHN Sandbox");
            response.put("shopId_used", "200309 (Quận 12, HCM)");
            response.put("destination", "District " + toDistrictId + ", Ward " + toWardCode);
            response.put("weight_gram", weightGram);
            response.put("calculated_fee_vnd", fee);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "FAILED");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
