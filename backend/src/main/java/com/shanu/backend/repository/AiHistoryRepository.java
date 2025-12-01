package com.shanu.backend.repository;

import com.shanu.backend.model.AiHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AiHistoryRepository extends MongoRepository<AiHistory, String> {
    List<AiHistory> findByUserId(String userId);
    List<AiHistory> findByUserIdOrderByCreatedAtDesc(String userId);
}
