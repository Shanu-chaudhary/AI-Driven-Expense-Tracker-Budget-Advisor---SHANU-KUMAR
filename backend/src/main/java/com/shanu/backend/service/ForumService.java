package com.shanu.backend.service;

import com.shanu.backend.model.ForumPost;
import com.shanu.backend.repository.ForumPostRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;

@Service
public class ForumService {
    private final ForumPostRepository repo;

    public ForumService(ForumPostRepository repo) {
        this.repo = repo;
    }

    public ForumPost createPost(ForumPost p) {
        p.setCreatedAt(Instant.now().toString());
        return repo.save(p);
    }

    public List<ForumPost> listPosts() {
        return repo.findAll();
    }

    public ForumPost addComment(String postId, ForumPost.Comment comment) {
        ForumPost p = repo.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        if (comment.getCreatedAt() == null) comment.setCreatedAt(Instant.now().toString());
        p.getComments().add(comment);
        return repo.save(p);
    }

    public ForumPost likePost(String postId, String userId) {
        ForumPost p = repo.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        p.setLikes(p.getLikes() + 1);
        return repo.save(p);
    }

    public void deletePost(String postId, String userId) {
        ForumPost p = repo.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        // only allow delete if the requester is the author
        if (p.getAuthorId() == null || userId == null || !p.getAuthorId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete post");
        }
        repo.deleteById(postId);
    }
}
