package com.shanu.backend.controller;

import com.shanu.backend.model.ForumPost;
import com.shanu.backend.service.AuthService;
import com.shanu.backend.service.ForumService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/forum")
@CrossOrigin(origins = "http://localhost:5173")
public class ForumController {

    private final ForumService forumService;
    private final AuthService authService;

    public ForumController(ForumService forumService, AuthService authService) {
        this.forumService = forumService;
        this.authService = authService;
    }

    @GetMapping("/posts")
    public ResponseEntity<?> listPosts() {
        try {
            List<ForumPost> posts = forumService.listPosts();
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@RequestHeader(value = "Authorization", required = false) String token, @RequestBody ForumPost p) {
        try {
            if (token != null && token.startsWith("Bearer ")) token = token.substring(7);
            if (token != null && !token.isBlank()) {
                try {
                    var user = authService.getUserFromToken(token);
                    p.setAuthorId(user.getId());
                    p.setAuthorName(user.getName() != null ? user.getName() : user.getEmail());
                } catch (Exception ex) {
                    // ignore, allow anonymous
                }
            }
            ForumPost saved = forumService.createPost(p);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<?> comment(@PathVariable String id, @RequestBody ForumPost.Comment comment, @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) token = token.substring(7);
            if (token != null && !token.isBlank()) {
                try {
                    var user = authService.getUserFromToken(token);
                    comment.setAuthorName(user.getName() != null ? user.getName() : user.getEmail());
                } catch (Exception ex) { }
            }
            var updated = forumService.addComment(id, comment);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<?> like(@PathVariable String id, @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            String userId = null;
            if (token != null && token.startsWith("Bearer ")) token = token.substring(7);
            if (token != null && !token.isBlank()) {
                try { var user = authService.getUserFromToken(token); userId = user.getId(); } catch (Exception ex) { }
            }
            var updated = forumService.likePost(id, userId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable String id, @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            String userId = null;
            if (token != null && token.startsWith("Bearer ")) token = token.substring(7);
            if (token != null && !token.isBlank()) {
                try { var user = authService.getUserFromToken(token); userId = user.getId(); } catch (Exception ex) { }
            }
            forumService.deletePost(id, userId);
            return ResponseEntity.ok(Map.of("deleted", true));
        } catch (RuntimeException re) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", re.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}
