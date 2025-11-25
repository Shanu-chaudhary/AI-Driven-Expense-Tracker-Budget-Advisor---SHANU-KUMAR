package com.shanu.backend.repository;

import com.shanu.backend.model.ForumPost;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ForumPostRepository extends MongoRepository<ForumPost, String> {
    List<ForumPost> findByAuthorId(String authorId);
}
