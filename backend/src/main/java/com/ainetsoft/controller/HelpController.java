package com.ainetsoft.controller;

import com.ainetsoft.model.HelpNode;
import com.ainetsoft.repository.HelpNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/help")
@RequiredArgsConstructor
public class HelpController {

    private final HelpNodeRepository helpNodeRepository;

    // 🚀 Get the full tree structure for the sidebar
    @GetMapping("/tree")
    public ResponseEntity<List<HelpNode>> getHelpTree() {
        return ResponseEntity.ok(helpNodeRepository.findAllByOrderByDisplayOrderAsc());
    }

    // 🚀 Admin: Create a new Node (Category or Article)
    // Admin sets 'parentId' to make it a sub-page
    @PostMapping("/nodes")
    public ResponseEntity<HelpNode> saveNode(@RequestBody HelpNode node) {
        return ResponseEntity.ok(helpNodeRepository.save(node));
    }

    // 🚀 Admin: Delete a node
    @DeleteMapping("/nodes/{id}")
    public ResponseEntity<Void> deleteNode(@PathVariable String id) {
        helpNodeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}