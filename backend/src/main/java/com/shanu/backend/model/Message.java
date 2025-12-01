package com.shanu.backend.model;

import org.springframework.data.annotation.Id;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Represents a single message in a conversation.
 * Can be from user or assistant.
 */
public class Message {
    @Id
    private String id;
    
    private String role; // "user" or "assistant"
    private String text;
    private List<String> options; // quick options for assistant messages
    private Map<String, Object> metadata; // confidence, source, etc.
    private LocalDateTime timestamp;

    // Constructors
    public Message() {
        this.timestamp = LocalDateTime.now();
    }

    public Message(String role, String text) {
        this.role = role;
        this.text = text;
        this.timestamp = LocalDateTime.now();
    }

    public Message(String role, String text, List<String> options) {
        this.role = role;
        this.text = text;
        this.options = options;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
