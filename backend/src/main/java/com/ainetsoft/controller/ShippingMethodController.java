package com.ainetsoft.controller;

import com.ainetsoft.model.ShippingMethod;
import com.ainetsoft.repository.ShippingMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shipping-methods")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ShippingMethodController {

    private final ShippingMethodRepository shippingMethodRepository;

    /**
     * For Sellers: Get only the active methods for the registration toggles.
     */
    @GetMapping("/active")
    public ResponseEntity<List<ShippingMethod>> getActiveMethods() {
        List<ShippingMethod> activeMethods = shippingMethodRepository.findAll()
                .stream()
                .filter(ShippingMethod::isActive)
                .collect(Collectors.toList());
        return ResponseEntity.ok(activeMethods);
    }

    /**
     * For Admin: Get all methods (including inactive ones) for the Management Dashboard.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ShippingMethod>> getAllMethods() {
        return ResponseEntity.ok(shippingMethodRepository.findAll());
    }

    /**
     * For Admin: Add a new shipping partner/method.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShippingMethod> createMethod(@RequestBody ShippingMethod method) {
        return ResponseEntity.ok(shippingMethodRepository.save(method));
    }

    /**
     * For Admin: Update existing method details or toggle status.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShippingMethod> updateMethod(@PathVariable String id, @RequestBody ShippingMethod details) {
        ShippingMethod method = shippingMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Phương thức vận chuyển không tồn tại"));
        
        method.setName(details.getName());
        method.setDescription(details.getDescription());
        method.setBaseCost(details.getBaseCost());
        method.setEstimatedTime(details.getEstimatedTime());
        method.setActive(details.isActive());
        
        return ResponseEntity.ok(shippingMethodRepository.save(method));
    }

    /**
     * For Admin: Remove a shipping method.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteMethod(@PathVariable String id) {
        shippingMethodRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}