package com.shanu.backend.repository;

import com.shanu.backend.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

/**
 * MongoDB repository for Conversation documents.
 * Queries by userId to support per-user conversation history.
 */
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    List<Conversation> findByUserIdOrderByUpdatedAtDesc(String userId);
    List<Conversation> findByUserId(String userId);
}
