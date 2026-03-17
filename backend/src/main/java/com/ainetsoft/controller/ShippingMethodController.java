package com.ainetsoft.controller;

import com.ainetsoft.model.ShippingMethod;
import com.ainetsoft.repository.ShippingMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipping-methods")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Ensure CORS allows your frontend to talk to this
public class ShippingMethodController {

    private final ShippingMethodRepository shippingMethodRepository;

    @GetMapping
    public ResponseEntity<List<ShippingMethod>> getAllActiveMethods() {
        return ResponseEntity.ok(shippingMethodRepository.findAll());
    }
}