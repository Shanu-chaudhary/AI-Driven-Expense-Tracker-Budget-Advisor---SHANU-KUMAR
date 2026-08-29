package com.shanu.backend.service;

import com.shanu.backend.model.Transaction;
import org.springframework.stereotype.Service;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ForecastService {

    /**
     * Forecast next month expenses using rolling average and trend
     */
    public Map<String, Double> forecastNextMonth(List<Transaction> transactionHistory) {
        // Group by month and category
        Map<YearMonth, Map<String, Double>> monthlyByCategory = groupTransactionsByMonthAndCategory(transactionHistory);
        
        Map<String, Double> forecast = new HashMap<>();
        
        for (String category : extractCategories(transactionHistory)) {
            List<Double> historicalValues = extractCategoryHistory(monthlyByCategory, category);
            
            if (historicalValues.size() >= 2) {
                // Use weighted moving average (recent months weighted more)
                Double predicted = weightedMovingAverage(historicalValues, 3);
                forecast.put(category, predicted);
            }
        }
        
        return forecast;
    }

    /**
     * Weighted moving average (recent values weighted more)
     */
    private Double weightedMovingAverage(List<Double> values, int window) {
        if (values.size() < window) {
            return values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        }

        List<Double> recentValues = values.subList(Math.max(0, values.size() - window), values.size());
        Double weightSum = 0.0;
        Double sum = 0.0;

        for (int i = 0; i < recentValues.size(); i++) {
            double weight = (i + 1.0) / recentValues.size(); // recent values get higher weight
            sum += recentValues.get(i) * weight;
            weightSum += weight;
        }

        return weightSum > 0 ? sum / weightSum : 0.0;
    }

    /**
     * Linear trend analysis (simple least-squares fit)
     */
    public Double linearTrendSlope(List<Double> values) {
        if (values.size() < 2) return 0.0;

        int n = values.size();
        Double sumX = 0.0, sumY = 0.0, sumXY = 0.0, sumX2 = 0.0;

        for (int i = 0; i < n; i++) {
            Double x = (double) i;
            Double y = values.get(i);
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }

        Double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return !slope.isInfinite() && !slope.isNaN() ? slope : 0.0;
    }

    /**
     * Group transactions by month and category
     */
    private Map<YearMonth, Map<String, Double>> groupTransactionsByMonthAndCategory(List<Transaction> transactions) {
        Map<YearMonth, Map<String, Double>> result = new HashMap<>();

        for (Transaction t : transactions) {
            if (t.getDate() == null) continue;
            if (t.getAmount() != null && t.getAmount() > 0 && !"income".equalsIgnoreCase(t.getCategory())) {
                YearMonth month = YearMonth.from(t.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
                result.computeIfAbsent(month, k -> new HashMap<>())
                    .merge(t.getCategory(), Math.abs(t.getAmount()), Double::sum);
            }
        }

        return result;
    }

    /**
     * Extract unique categories from transactions
     */
    private Set<String> extractCategories(List<Transaction> transactions) {
        return transactions.stream()
            .map(Transaction::getCategory)
            .filter(cat -> !cat.equalsIgnoreCase("income"))
            .collect(Collectors.toSet());
    }

    /**
     * Extract historical values for a category
     */
    private List<Double> extractCategoryHistory(Map<YearMonth, Map<String, Double>> monthlyByCategory, String category) {
        return monthlyByCategory.values().stream()
            .map(m -> m.getOrDefault(category, 0.0))
            .collect(Collectors.toList());
    }

    /**
     * Calculate rolling average
     */
    public Double rollingAverage(List<Double> values, int window) {
        if (values.isEmpty() || window <= 0) return 0.0;
        int start = Math.max(0, values.size() - window);
        return values.subList(start, values.size())
            .stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);
    }
}
