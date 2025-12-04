package com.shanu.backend.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    
    @Value("${gemini.model:gemini-1.5-pro}")
    private String model;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Logger log = LoggerFactory.getLogger(GeminiClient.class);

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

        // Build URL without embedding the key in the query string — use Authorization header instead.
        String url = apiUrl.endsWith("/") ? apiUrl + model + ":generateContent" : apiUrl + "/" + model + ":generateContent";

        // Build Gemini request body
        Map<String, Object> request = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, String> part = new HashMap<>();
        part.put("text", prompt);
        contents.put("parts", List.of(part));
        request.put("contents", List.of(contents));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("Authorization", "Bearer " + apiKey);

        String body = objectMapper.writeValueAsString(request);
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        // Simple retry loop with exponential backoff + jitter to tolerate transient failures
        final int maxAttempts = 3;
        long backoffMillis = 500;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.debug("Calling Gemini (attempt {}): {}", attempt, url);
                ResponseEntity<String> resp = restTemplate.postForEntity(url, entity, String.class);
                int status = resp.getStatusCode().value();
                String responseBody = resp.getBody() == null ? "" : resp.getBody();

                if (status >= 200 && status < 300) {
                    String text = extractTextFromGeminiResponse(responseBody);
                    log.debug("Gemini response extracted length={}", text == null ? 0 : text.length());
                    return text;
                } else {
                    String msg = String.format("Gemini returned non-success status %d", status);
                    log.warn(msg + " - body: {}", responseBody);
                    if (attempt == maxAttempts) {
                        throw new RuntimeException(msg + ": " + responseBody);
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini API call failed on attempt {}: {}", attempt, e.getMessage());
                if (attempt == maxAttempts) {
                    throw new RuntimeException("Gemini API call failed after retries: " + e.getMessage(), e);
                }
            }

            // backoff with jitter
            long jitter = (long) (Math.random() * 100);
            try {
                Thread.sleep(backoffMillis + jitter);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Interrupted during retry backoff", ie);
            }
            backoffMillis *= 2;
        }

        throw new RuntimeException("Gemini API call failed (unreachable code)");
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
