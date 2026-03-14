package com.ainetsoft.controller;

import com.ainetsoft.model.Category;
import com.ainetsoft.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    /**
     * PUBLIC: Get all active categories.
     * Used by the Home page and the Seller's "Add Product" form.
     */
    @GetMapping
    public ResponseEntity<List<Category>> getActiveCategories() {
        return ResponseEntity.ok(categoryRepository.findByActiveTrue());
    }

    /**
     * ADMIN ONLY: Create a new category.
     */
    @PostMapping("/admin/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> addCategory(@RequestBody Category category) {
        // Generate a URL-friendly slug if not provided
        if (category.getSlug() == null || category.getSlug().isEmpty()) {
            category.setSlug(category.getName().toLowerCase()
                    .replace(" ", "-")
                    .replaceAll("[^a-z0-9-]", ""));
        }
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    /**
     * ADMIN ONLY: Update an existing category.
     */
    @PutMapping("/admin/update/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> updateCategory(@PathVariable String id, @RequestBody Category updatedCategory) {
        return categoryRepository.findById(id)
                .map(category -> {
                    category.setName(updatedCategory.getName());
                    category.setActive(updatedCategory.isActive());
                    category.setIconName(updatedCategory.getIconName());
                    return ResponseEntity.ok(categoryRepository.save(category));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * ADMIN ONLY: Delete a category.
     */
    @DeleteMapping("/admin/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCategory(@PathVariable String id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}