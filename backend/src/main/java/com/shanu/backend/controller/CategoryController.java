package com.shanu.backend.controller;

import com.shanu.backend.model.Category;
import com.shanu.backend.model.User;
import com.shanu.backend.service.AuthService;
import com.shanu.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:5173")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private AuthService authService;

    @PostMapping("/create")
    public ResponseEntity<?> createCategory(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> body) {
        try {
            String cleanToken = token != null && token.startsWith("Bearer ") ? token.substring(7) : token;
            User user = authService.getUserFromToken(cleanToken);
            String name = body.get("name");
            String type = body.get("type"); // "income" or "expense"

            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Category name required"));
            }
            if (!"income".equals(type) && !"expense".equals(type)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Type must be income or expense"));
            }

                Category created = categoryService.createCategory(user.getId(), name.trim(), type);
                // return lightweight DTO to avoid including DBRef user and other nested props
                return ResponseEntity.ok(Map.of(
                    "id", created.getId(),
                    "name", created.getName(),
                    "type", created.getType()
                ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> listCategories(@RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token != null && token.startsWith("Bearer ") ? token.substring(7) : token;
            User user = authService.getUserFromToken(cleanToken);
                List<Category> list = categoryService.listCategories(user.getId());
                // convert to lightweight DTOs
                    List<Map<String, String>> out = list.stream().map(c -> Map.of(
                    "id", c.getId(),
                    "_id", c.getId(),
                    "name", c.getName(),
                    "type", c.getType()
                    )).toList();
                return ResponseEntity.ok(out);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@RequestHeader("Authorization") String token, @PathVariable("id") String id) {
        try {
            String cleanToken = token != null && token.startsWith("Bearer ") ? token.substring(7) : token;
            User user = authService.getUserFromToken(cleanToken);
            categoryService.deleteCategory(user.getId(), id);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
