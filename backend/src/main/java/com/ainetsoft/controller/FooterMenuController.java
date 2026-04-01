package com.ainetsoft.controller;

import com.ainetsoft.model.FooterMenu;
import com.ainetsoft.repository.FooterMenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/footer-menus")
@RequiredArgsConstructor
public class FooterMenuController {

    private final FooterMenuRepository footerMenuRepository;

    // 🚀 Get all menu columns (Public & Admin)
    @GetMapping
    public ResponseEntity<List<FooterMenu>> getAllMenus() {
        return ResponseEntity.ok(footerMenuRepository.findAllByOrderByDisplayOrderAsc());
    }

    // 🚀 Admin: Add or Update a column (with its list of links)
    @PostMapping
    public ResponseEntity<FooterMenu> saveMenu(@RequestBody FooterMenu menu) {
        return ResponseEntity.ok(footerMenuRepository.save(menu));
    }

    // 🚀 Admin: Delete an entire column
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenu(@PathVariable String id) {
        footerMenuRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}