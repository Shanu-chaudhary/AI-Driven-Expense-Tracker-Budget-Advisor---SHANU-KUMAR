package com.shanu.backend.repository;

import com.shanu.backend.model.UserProfile;
import com.shanu.backend.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserProfileRepository extends MongoRepository<UserProfile, String> {
    Optional<UserProfile> findByUser(User user);
}
