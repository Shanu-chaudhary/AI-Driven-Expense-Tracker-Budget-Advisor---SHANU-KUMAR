package com.shanu.backend.service;

import com.shanu.backend.model.Transaction;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TipService {

    /**
     * Generate rule-based tips based on spending patterns
     */
    public Map<String, Object> recommendTips(List<Transaction> transactions) {
        Map<String, Object> analysis = analyzeSpending(transactions);
        List<String> tips = generateTips(analysis);

        return Map.of(
            "tips", tips,
            "analysis", analysis
        );
    }

    /**
     * Analyze spending to generate insights
     */
    private Map<String, Object> analyzeSpending(List<Transaction> transactions) {
        Map<String, Double> categoryTotals = new HashMap<>();
        Double totalExpense = 0.0;
        Double totalIncome = 0.0;

        for (Transaction t : transactions) {
            if ("income".equalsIgnoreCase(t.getCategory())) {
                totalIncome += Math.abs(t.getAmount());
            } else {
                Double amount = Math.abs(t.getAmount());
                categoryTotals.put(t.getCategory(), 
                    categoryTotals.getOrDefault(t.getCategory(), 0.0) + amount);
                totalExpense += amount;
            }
        }

        // Calculate percentages
        Map<String, Double> categoryPercentages = new HashMap<>();
        if (totalExpense > 0) {
            for (Map.Entry<String, Double> entry : categoryTotals.entrySet()) {
                double percentage = (entry.getValue() / totalExpense) * 100;
                categoryPercentages.put(entry.getKey(), percentage);
            }
        }

        Double savingRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

        return Map.of(
            "totalExpense", totalExpense,
            "totalIncome", totalIncome,
            "savingRate", savingRate,
            "categories", categoryTotals,
            "categoryPercentages", categoryPercentages,
            "transactionCount", transactions.size()
        );
    }

    /**
     * Generate 4-6 rule-based tips
     */
    private List<String> generateTips(Map<String, Object> analysis) {
        List<String> tips = new ArrayList<>();

        Object catPctObj = analysis.get("categoryPercentages");
        Map<String, Double> categoryPercentages = new HashMap<>();
        if (catPctObj instanceof Map) {
            try {
                Map<?, ?> tmp = (Map<?, ?>) catPctObj;
                for (Map.Entry<?, ?> e : tmp.entrySet()) {
                    if (e.getKey() != null && e.getValue() instanceof Number) {
                        categoryPercentages.put(e.getKey().toString(), ((Number) e.getValue()).doubleValue());
                    }
                }
            } catch (ClassCastException ignored) {
            }
        }

        Object saveObj = analysis.get("savingRate");
        Double savingRate = saveObj instanceof Number ? ((Number) saveObj).doubleValue() : 0.0;
        // totalExpense and totalIncome values are available in analysis if needed

        // Rule 1: High food spending
        if (categoryPercentages.getOrDefault("food", 0.0) > 30) {
            tips.add("💡 Food spending is above 30% of your budget. Consider meal planning and batch cooking to reduce this category.");
        }

        // Rule 2: High entertainment spending
        if (categoryPercentages.getOrDefault("entertainment", 0.0) > 20) {
            tips.add("🎬 Entertainment expenses are 20%+ of your budget. Try setting a monthly entertainment cap.");
        }

        // Rule 3: High transport spending
        if (categoryPercentages.getOrDefault("transport", 0.0) > 15) {
            tips.add("🚗 Transportation is taking up over 15% of your budget. Explore carpooling or public transit options.");
        }

        // Rule 4: Low savings rate
        if (savingRate < 10) {
            tips.add("⚠️ Your savings rate is below 10%. Try cutting discretionary spending to improve financial security.");
        }

        // Rule 5: Utilities efficiency
        if (categoryPercentages.getOrDefault("utilities", 0.0) > 10) {
            tips.add("💡 Utilities are over 10%. Audit your subscriptions and energy usage for quick savings.");
        }

        // Rule 6: High shopping
        if (categoryPercentages.getOrDefault("shopping", 0.0) > 20) {
            tips.add("🛍️ Shopping expenses are significant. Consider a 48-hour rule before non-essential purchases.");
        }

        // Rule 7: General positive reinforcement
        if (savingRate >= 20) {
            tips.add("✨ Great job! Your saving rate is 20%+. Keep up the excellent financial discipline!");
        }

        // Ensure at least 4 tips, max 6
        if (tips.size() < 4) {
            tips.add("📊 Track your expenses regularly to identify spending patterns and opportunities.");
        }
        if (tips.size() < 4) {
            tips.add("💰 Build an emergency fund equal to 3-6 months of living expenses.");
        }

        return tips.stream().limit(6).collect(Collectors.toList());
    }
}
