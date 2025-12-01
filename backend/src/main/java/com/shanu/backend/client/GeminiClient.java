package com.shanu.backend.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * HTTP wrapper for Gemini API calls.
 * Encapsulates REST calls to Gemini (or OpenAI-compatible endpoint).
 * 
 * Environment variables required:
 * - GEMINI_API_KEY: API key for Gemini
 * - GEMINI_API_URL: Base URL for API (e.g., https://api.openai.com/v1 or Gemini endpoint)
 * 
 * TODO: Add circuit breaker and exponential backoff for production.
 */
@Component
public class GeminiClient {
    
    @Value("${gemini.api.key:}")
    private String apiKey;
    
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String apiUrl;
    
    @Value("${gemini.model:gemini-pro}")
    private String model;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Call Gemini API with a prompt and return raw response.
     * Expects the model to return JSON-formatted text.
     * 
     * @param prompt The user prompt/message
     * @return Raw string response from Gemini
     */
    public String callGemini(String prompt) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Gemini API key not configured. Set GEMINI_API_KEY env var.");
        }

        String url = apiUrl + "/" + model + ":generateContent?key=" + apiKey;

        // Build Gemini request
        Map<String, Object> request = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, String> part = new HashMap<>();
        part.put("text", prompt);
        contents.put("parts", List.of(part));
        request.put("contents", List.of(contents));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(request), headers);

        try {
            String response = restTemplate.postForObject(url, entity, String.class);
            
            // Extract text from Gemini response structure
            String text = extractTextFromGeminiResponse(response);
            return text;
        } catch (Exception e) {
            throw new RuntimeException("Gemini API call failed: " + e.getMessage(), e);
        }
    }

    /**
     * Extract the text content from Gemini's response JSON.
     * Gemini returns: { "candidates": [{ "content": { "parts": [{ "text": "..." }] } }] }
     */
    private String extractTextFromGeminiResponse(String responseJson) throws Exception {
        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(responseJson);
            return root.at("/candidates/0/content/parts/0/text").asText("");
        } catch (Exception e) {
            // Fallback: return response as-is if parsing fails
            return responseJson;
        }
    }

    /**
     * Check if the API key is configured.
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
