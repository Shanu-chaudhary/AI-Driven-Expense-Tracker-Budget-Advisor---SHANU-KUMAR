package com.shanu.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "alerts")
public class Alert {
    @Id
    private String id;
    
    private String userId;
    private String type; // "spending_spike", "budget_warning", etc.
    private String message;
    private String category; // optional category
    private Double anomalyValue; // the detected value
    private Double expectedValue; // the expected/baseline value
    private Boolean isRead;
    private LocalDateTime createdAt;

    // Constructors
    public Alert() {}

    public Alert(String userId, String type, String message, String category, 
                 Double anomalyValue, Double expectedValue) {
        this.userId = userId;
        this.type = type;
        this.message = message;
        this.category = category;
        this.anomalyValue = anomalyValue;
        this.expectedValue = expectedValue;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Double getAnomalyValue() { return anomalyValue; }
    public void setAnomalyValue(Double anomalyValue) { this.anomalyValue = anomalyValue; }

    public Double getExpectedValue() { return expectedValue; }
    public void setExpectedValue(Double expectedValue) { this.expectedValue = expectedValue; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
