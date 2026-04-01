package com.ainetsoft.controller;

import com.ainetsoft.model.FooterIcon;
import com.ainetsoft.repository.FooterIconRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/footer-icons")
@RequiredArgsConstructor
public class FooterIconController {

    private final FooterIconRepository footerIconRepository;

    // 🚀 Get icons by category (PAYMENT or SHIPPING)
    @GetMapping("/{category}")
    public ResponseEntity<List<FooterIcon>> getIcons(@PathVariable String category) {
        return ResponseEntity.ok(footerIconRepository.findByCategoryOrderByDisplayOrderAsc(category));
    }

    @PostMapping
    public ResponseEntity<FooterIcon> saveIcon(@RequestBody FooterIcon icon) {
        return ResponseEntity.ok(footerIconRepository.save(icon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIcon(@PathVariable String id) {
        footerIconRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}