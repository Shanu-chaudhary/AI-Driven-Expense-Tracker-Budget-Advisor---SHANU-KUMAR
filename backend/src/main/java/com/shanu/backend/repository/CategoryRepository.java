package com.shanu.backend.repository;

import com.shanu.backend.model.Category;
import com.shanu.backend.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByUser(User user);
    List<Category> findByUserAndActiveTrue(User user);
    Category findByUserAndNameIgnoreCase(User user, String name);
    boolean existsByUserAndNameIgnoreCase(User user, String name);
}
