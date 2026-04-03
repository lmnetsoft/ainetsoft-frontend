package com.ainetsoft.controller;

import com.ainetsoft.model.ContentNode;
import com.ainetsoft.repository.ContentNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/help")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContentHierarchyController {

    private final ContentNodeRepository contentNodeRepository;

    /**
     * Frontend is calling GET /api/help/tree to load the initial list.
     * Fixed the path here to match!
     */
    @GetMapping("/tree")
    public ResponseEntity<List<ContentNode>> getContentTree() {
        return ResponseEntity.ok(contentNodeRepository.findAllByOrderByDisplayOrderAsc());
    }

    /**
     * Frontend is calling POST /api/help/nodes to save new categories/articles.
     */
    @PostMapping("/nodes")
    public ResponseEntity<ContentNode> saveNode(@RequestBody ContentNode node) {
        return ResponseEntity.ok(contentNodeRepository.save(node));
    }

    /**
     * Matches DELETE /api/help/nodes/{id}
     */
    @DeleteMapping("/nodes/{id}")
    public ResponseEntity<Void> deleteNode(@PathVariable String id) {
        contentNodeRepository.deleteByParentId(id);
        contentNodeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}