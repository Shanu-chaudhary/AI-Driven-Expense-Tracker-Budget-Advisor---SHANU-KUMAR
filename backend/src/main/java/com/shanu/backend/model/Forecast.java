package com.shanu.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "forecasts")
public class Forecast {
    @Id
    private String id;
    
    private String userId;
    private LocalDateTime forecastMonth;
    private Map<String, Double> categoryExpensesForecast; // category -> predicted expense
    private Map<String, Double> categoryTrendSlope; // linear trend
    private Double totalForecastedExpense;
    private LocalDateTime createdAt;

    // Constructors
    public Forecast() {}

    public Forecast(String userId, LocalDateTime forecastMonth, 
                    Map<String, Double> categoryExpensesForecast,
                    Map<String, Double> categoryTrendSlope,
                    Double totalForecastedExpense) {
        this.userId = userId;
        this.forecastMonth = forecastMonth;
        this.categoryExpensesForecast = categoryExpensesForecast;
        this.categoryTrendSlope = categoryTrendSlope;
        this.totalForecastedExpense = totalForecastedExpense;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getForecastMonth() { return forecastMonth; }
    public void setForecastMonth(LocalDateTime forecastMonth) { this.forecastMonth = forecastMonth; }

    public Map<String, Double> getCategoryExpensesForecast() { return categoryExpensesForecast; }
    public void setCategoryExpensesForecast(Map<String, Double> categoryExpensesForecast) {
        this.categoryExpensesForecast = categoryExpensesForecast;
    }

    public Map<String, Double> getCategoryTrendSlope() { return categoryTrendSlope; }
    public void setCategoryTrendSlope(Map<String, Double> categoryTrendSlope) {
        this.categoryTrendSlope = categoryTrendSlope;
    }

    public Double getTotalForecastedExpense() { return totalForecastedExpense; }
    public void setTotalForecastedExpense(Double totalForecastedExpense) {
        this.totalForecastedExpense = totalForecastedExpense;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
