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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AiService {
    
    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    
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
    public Map<String, Object> generatePersonalizedAdvice(String userId, List<Transaction> transactions, String scope) {
        if (!aiEnabled || apiKey == null || apiKey.isBlank()) {
            log.warn("AI not enabled or API key not configured. aiEnabled={}, apiKey exists={}", aiEnabled, apiKey != null && !apiKey.isBlank());
            return Map.of("error", "AI not enabled or API key not configured");
        }

        log.info("Generating AI advice for user {} with {} transactions", userId, transactions.size());

        // Summarize transactions without PII
        Map<String, Object> summary = summarizeTransactions(transactions);
        log.info("Transaction summary: {}", summary);
        
        String prompt = buildAdvicePrompt(summary, scope);
        
        try {
            return callGeminiApi(prompt);
        } catch (Exception e) {
            log.error("Failed to call Gemini API", e);
            return Map.of("error", "Failed to call Gemini API: " + e.getMessage());
        }
    }

    /**
     * Analyze spending patterns from transaction history
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
        log.info("Calling Gemini API at: {}", url);
        log.debug("Prompt being sent: {}", prompt);

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
        log.debug("Gemini API response: {}", response);

        // Parse response
        JsonNode root = objectMapper.readTree(response);
        String generatedText = root.at("/candidates/0/content/parts/0/text").asText("");
        log.debug("Extracted text from response: {}", generatedText);

        // Extract JSON from response
        return parseJsonFromResponse(generatedText);
    }

    /**
     * Extract JSON from LLM response (handles markdown code blocks and wrapped text)
     */
    private Map<String, Object> parseJsonFromResponse(String response) throws Exception {
        // Remove markdown code blocks if present
        String cleaned = response
            .replaceAll("```json", "")
            .replaceAll("```", "")
            .trim();

        // Try to extract JSON object if response has extra text
        // Look for first { and last }
        int jsonStart = cleaned.indexOf('{');
        int jsonEnd = cleaned.lastIndexOf('}');
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
            log.debug("Extracted JSON substring: {}", cleaned);
        }

        try {
            Map<String, Object> result = objectMapper.readValue(cleaned, new TypeReference<Map<String, Object>>() {});
            log.info("Successfully parsed AI response as JSON");
            return result;
        } catch (Exception e) {
            log.error("Failed to parse response as JSON. Raw response: {}", response, e);
            return Map.of(
                "summary", "Error: Invalid response format from AI. Please try again.",
                "actions", List.of("Check your transactions", "Try again later"),
                "estimatedSavingsNextMonth", 0,
                "confidenceScore", 0,
                "citations", List.of("error"),
                "raw_response", response,
                "parse_error", e.getMessage()
            );
        }
    }

    /**
     * Build a sanitized prompt for advice generation (no PII)
     */
    private String buildAdvicePrompt(Map<String, Object> transactionSummary, String scope) {
        String contextMessage;
        String actionHint;
        
        if ("all".equals(scope)) {
            contextMessage = "You are an expert financial advisor analyzing a user's complete transaction history. Provide long-term financial strategy recommendations.\n\n" +
                "Complete Transaction Analysis:\n" +
                "- Total Income (All Time): ₹" + transactionSummary.getOrDefault("totalIncome", 0) + "\n" +
                "- Total Expenses (All Time): ₹" + transactionSummary.getOrDefault("totalExpense", 0) + "\n" +
                "- Number of Transactions: " + transactionSummary.getOrDefault("transactionCount", 0) + "\n" +
                "- Spending by Category:\n" +
                formatCategories((Map<String, Double>) transactionSummary.get("categories")) + "\n\n";
            actionHint = "Provide 3 long-term financial improvement strategies";
        } else {
            contextMessage = "You are an expert financial advisor analyzing current month spending. Provide immediate actionable recommendations.\n\n" +
                "Current Month Summary:\n" +
                "- Monthly Income: ₹" + transactionSummary.getOrDefault("totalIncome", 0) + "\n" +
                "- Monthly Expenses: ₹" + transactionSummary.getOrDefault("totalExpense", 0) + "\n" +
                "- Number of Transactions: " + transactionSummary.getOrDefault("transactionCount", 0) + "\n" +
                "- Spending by Category:\n" +
                formatCategories((Map<String, Double>) transactionSummary.get("categories")) + "\n\n";
            actionHint = "Provide 3 immediate actions to optimize spending this month";
        }
        
        return contextMessage +
            actionHint + " in ONLY valid JSON format (no markdown, no code blocks) with these exact fields:\n" +
            "{\n" +
            "  \"summary\": \"A brief assessment of the spending situation (2-3 sentences)\",\n" +
            "  \"actions\": [\"Specific action 1\", \"Specific action 2\", \"Specific action 3\"],\n" +
            "  \"estimatedSavingsNextMonth\": <number>,\n" +
            "  \"confidenceScore\": <0-100>,\n" +
            "  \"citations\": [\"data-based\"]\n" +
            "}\n\n" +
            "Do NOT include any explanatory text outside the JSON. Respond with ONLY the JSON object.";
    }

    private String formatCategories(Map<String, Double> categories) {
        if (categories == null || categories.isEmpty()) return "  No category data";
        StringBuilder sb = new StringBuilder();
        categories.forEach((cat, total) -> 
            sb.append("  - ").append(cat).append(": ₹").append(String.format("%.2f", total)).append("\n")
        );
        return sb.toString();
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
            Double amount = t.getAmount() != null ? t.getAmount() : 0.0;
            String category = t.getCategory() != null ? t.getCategory() : "Other";
            String type = t.getType() != null ? t.getType().toLowerCase() : "expense";

            if ("income".equalsIgnoreCase(type) || "income".equalsIgnoreCase(category)) {
                totalIncome += Math.abs(amount);
            } else {
                categoryTotals.put(category, 
                    categoryTotals.getOrDefault(category, 0.0) + Math.abs(amount));
                totalExpense += Math.abs(amount);
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
