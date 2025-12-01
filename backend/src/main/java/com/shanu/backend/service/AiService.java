package com.shanu.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.shanu.backend.model.Transaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import java.util.*;

@Service
public class AiService {
    
    @Value("${ai.enabled:false}")
    private Boolean aiEnabled;
    
    @Value("${ai.model:gemini-pro}")
    private String aiModel;
    
    @Value("${ai.key:}")
    private String apiKey;
    
    @Value("${ai.baseUrl:https://generativelanguage.googleapis.com/v1beta/models}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate personalized financial advice based on user transactions
     */
    public Map<String, Object> generatePersonalizedAdvice(String userId, List<Transaction> transactions) {
        if (!aiEnabled || apiKey == null || apiKey.isBlank()) {
            return Map.of("error", "AI not enabled or API key not configured");
        }

        // Summarize transactions without PII
        Map<String, Object> summary = summarizeTransactions(transactions);
        
        String prompt = buildAdvicePrompt(summary);
        
        try {
            return callGeminiApi(prompt);
        } catch (Exception e) {
            return Map.of("error", "Failed to call Gemini API: " + e.getMessage());
        }
    }

    /**
     * Analyze spending patterns from transaction history
     */
    public Map<String, Object> analyzeSpendingPatterns(String userId, List<Transaction> history) {
        if (!aiEnabled || apiKey == null || apiKey.isBlank()) {
            return Map.of("error", "AI not enabled");
        }

        Map<String, Double> categoryTotals = new HashMap<>();
        Double totalExpense = 0.0;

        for (Transaction t : history) {
            if (t.getAmount() > 0) { // expenses
                categoryTotals.put(t.getCategory(), 
                    categoryTotals.getOrDefault(t.getCategory(), 0.0) + t.getAmount());
                totalExpense += t.getAmount();
            }
        }

        String prompt = "Analyze these spending patterns (no PII): " + 
            "Categories: " + categoryTotals + 
            ", Total: " + totalExpense + 
            ". Provide brief analysis in JSON format with 'patterns' array and 'recommendations' array. " +
            "Respond ONLY with valid JSON.";

        try {
            return callGeminiApi(prompt);
        } catch (Exception e) {
            return Map.of("error", "Failed to analyze patterns: " + e.getMessage());
        }
    }

    /**
     * Predict potential savings based on monthly totals
     */
    public Map<String, Object> predictSavings(String userId, Map<String, Double> monthlyTotals) {
        if (!aiEnabled || apiKey == null || apiKey.isBlank()) {
            return Map.of("error", "AI not enabled");
        }

        String prompt = "Based on these monthly expense totals (no PII): " +
            monthlyTotals +
            ". Predict potential monthly savings and actions to take. " +
            "Return JSON with 'estimatedSavings', 'actions' array, and 'confidenceScore'. " +
            "Respond ONLY with valid JSON.";

        try {
            return callGeminiApi(prompt);
        } catch (Exception e) {
            return Map.of("error", "Failed to predict savings: " + e.getMessage());
        }
    }

    /**
     * Call Gemini API and parse JSON response
     */
    private Map<String, Object> callGeminiApi(String prompt) throws Exception {
        String url = baseUrl + "/" + aiModel + ":generateContent?key=" + apiKey;

        // Build request
        Map<String, Object> request = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, String> part = new HashMap<>();
        part.put("text", prompt);
        contents.put("parts", List.of(part));
        request.put("contents", List.of(contents));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(request), headers);

        // Call API
        String response = restTemplate.postForObject(url, entity, String.class);

        // Parse response
        JsonNode root = objectMapper.readTree(response);
        String generatedText = root.at("/candidates/0/content/parts/0/text").asText("");

        // Extract JSON from response
        return parseJsonFromResponse(generatedText);
    }

    /**
     * Extract JSON from LLM response (handles markdown code blocks)
     */
    private Map<String, Object> parseJsonFromResponse(String response) throws Exception {
        // Remove markdown code blocks if present
        String cleaned = response
            .replaceAll("```json", "")
            .replaceAll("```", "")
            .trim();

        try {
            return objectMapper.readValue(cleaned, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of("raw_response", response, "parse_error", e.getMessage());
        }
    }

    /**
     * Build a sanitized prompt for advice generation (no PII)
     */
    private String buildAdvicePrompt(Map<String, Object> transactionSummary) {
        return "Based on these anonymized spending patterns: " +
            transactionSummary +
            ". Provide personalized financial advice in JSON format with keys: " +
            "summary (string), actions (array of strings), estimatedSavingsNextMonth (number), " +
            "confidenceScore (0-100), citations (array). " +
            "Do NOT reference any names, emails, or personal identifiers. " +
            "Respond ONLY with valid JSON.";
    }

    /**
     * Summarize transactions without exposing PII
     */
    private Map<String, Object> summarizeTransactions(List<Transaction> transactions) {
        Map<String, Double> categoryTotals = new HashMap<>();
        Double totalExpense = 0.0;
        Double totalIncome = 0.0;
        Integer transactionCount = transactions.size();

        for (Transaction t : transactions) {
            if (t.getAmount() > 0) {
                if ("income".equalsIgnoreCase(t.getCategory())) {
                    totalIncome += t.getAmount();
                } else {
                    categoryTotals.put(t.getCategory(), 
                        categoryTotals.getOrDefault(t.getCategory(), 0.0) + t.getAmount());
                    totalExpense += t.getAmount();
                }
            }
        }

        return Map.of(
            "totalExpense", totalExpense,
            "totalIncome", totalIncome,
            "categories", categoryTotals,
            "transactionCount", transactionCount
        );
    }

    /**
     * Check if AI is enabled
     */
    public Boolean isAiEnabled() {
        return aiEnabled && apiKey != null && !apiKey.isBlank();
    }
}
