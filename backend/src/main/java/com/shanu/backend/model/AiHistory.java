package com.shanu.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

@Document(collection = "ai_history")
public class AiHistory {
    @Id
    private String id;
    
    private String userId;
    private String scope; // "monthly", "yearly", "detailed"
    private LocalDateTime createdAt;
    
    @JsonProperty("summary")
    private String summary;
    
    @JsonProperty("actions")
    private List<String> actions;
    
    @JsonProperty("estimatedSavingsNextMonth")
    private Double estimatedSavingsNextMonth;
    
    @JsonProperty("confidenceScore")
    private Integer confidenceScore;
    
    @JsonProperty("citations")
    private List<String> citations;

    // Constructors
    public AiHistory() {}

    public AiHistory(String userId, String scope, String summary, List<String> actions,
                     Double estimatedSavingsNextMonth, Integer confidenceScore, List<String> citations) {
        this.userId = userId;
        this.scope = scope;
        this.summary = summary;
        this.actions = actions;
        this.estimatedSavingsNextMonth = estimatedSavingsNextMonth;
        this.confidenceScore = confidenceScore;
        this.citations = citations;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public List<String> getActions() { return actions; }
    public void setActions(List<String> actions) { this.actions = actions; }

    public Double getEstimatedSavingsNextMonth() { return estimatedSavingsNextMonth; }
    public void setEstimatedSavingsNextMonth(Double estimatedSavingsNextMonth) {
        this.estimatedSavingsNextMonth = estimatedSavingsNextMonth;
    }

    public Integer getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Integer confidenceScore) { this.confidenceScore = confidenceScore; }

    public List<String> getCitations() { return citations; }
    public void setCitations(List<String> citations) { this.citations = citations; }
}
