package com.shanu.backend.service;

import com.shanu.backend.model.Category;
import com.shanu.backend.model.User;
import com.shanu.backend.repository.CategoryRepository;
import com.shanu.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    public Category createCategory(String userId, String name, String type) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        // Prevent duplicates for same user (case-insensitive)
        Category existing = categoryRepository.findByUserAndNameIgnoreCase(user, name);
        if (existing != null) {
            if (existing.isActive()) {
                throw new RuntimeException("Category already exists");
            } else {
                // reactivate hidden category
                existing.setActive(true);
                existing.setType(type);
                existing.setName(name);
                return categoryRepository.save(existing);
            }
        }

        Category category = new Category();
        category.setUser(user);
        category.setName(name);
        category.setType(type);
        category.setActive(true);
        return categoryRepository.save(category);
    }

    public List<Category> listCategories(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        // only return active categories for user's dropdown
        return categoryRepository.findByUserAndActiveTrue(user);
    }

    public void deleteCategory(String userId, String categoryId) {
        // Soft-hide category for this user so analytics remain intact
        Category c = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        if (!c.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this category");
        }
        c.setActive(false);
        categoryRepository.save(c);
    }
}
