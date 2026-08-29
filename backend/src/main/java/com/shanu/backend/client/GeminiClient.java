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
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.AccessToken;
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
    
    @Value("${gemini.api.key}")
    private String apiKey;
    
    @Value("${gemini.api.url}")
    private String apiUrl;
    
    @Value("${gemini.model}")
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
    // public String callGemini(String prompt) throws Exception {
    //     if (apiKey == null || apiKey.isBlank()) {
    //         throw new IllegalStateException("Gemini API key not configured. Set GEMINI_API_KEY env var.");
    //     }

    //     // Build URL without embedding the key in the query string — use Authorization header instead.
    //     String url = apiUrl.endsWith("/") ? apiUrl + model + ":generateContent" : apiUrl + "/" + model + ":generateContent";

    //     // Build Gemini request body
    //     Map<String, Object> request = new HashMap<>();
    //     Map<String, Object> contents = new HashMap<>();
    //     Map<String, String> part = new HashMap<>();
    //     part.put("text", prompt);
    //     contents.put("parts", List.of(part));
    //     request.put("contents", List.of(contents));

    //     HttpHeaders headers = new HttpHeaders();
    //     headers.setContentType(MediaType.APPLICATION_JSON);
    //     headers.setAccept(List.of(MediaType.APPLICATION_JSON));
    //     headers.set("Authorization", "Bearer " + apiKey);

    //     String body = objectMapper.writeValueAsString(request);
    //     HttpEntity<String> entity = new HttpEntity<>(body, headers);

    //     // Simple retry loop with exponential backoff + jitter to tolerate transient failures
    //     final int maxAttempts = 3;
    //     long backoffMillis = 500;
    //     for (int attempt = 1; attempt <= maxAttempts; attempt++) {
    //         try {
    //             log.debug("Calling Gemini (attempt {}): {}", attempt, url);
    //             ResponseEntity<String> resp = restTemplate.postForEntity(url, entity, String.class);
    //             int status = resp.getStatusCode().value();
    //             String responseBody = resp.getBody() == null ? "" : resp.getBody();

    //             if (status >= 200 && status < 300) {
    //                 String text = extractTextFromGeminiResponse(responseBody);
    //                 log.debug("Gemini response extracted length={}", text == null ? 0 : text.length());
    //                 return text;
    //             } else {
    //                 String msg = String.format("Gemini returned non-success status %d", status);
    //                 log.warn(msg + " - body: {}", responseBody);

    //                 // If unauthorized, try fallback: some Google API keys require using ?key=API_KEY
    //                 if ((status == 401 || status == 403) && attempt == maxAttempts) {
    //                     try {
    //                         String fallbackUrl = url + (url.contains("?") ? "&" : "?") + "key=" + apiKey;
    //                         log.info("Attempting fallback call with API key as query param");
    //                         ResponseEntity<String> fallbackResp = restTemplate.postForEntity(fallbackUrl, entity, String.class);
    //                         int fbStatus = fallbackResp.getStatusCode().value();
    //                         String fbBody = fallbackResp.getBody() == null ? "" : fallbackResp.getBody();
    //                         log.warn("Fallback attempt returned status {} - body: {}", fbStatus, fbBody);
    //                         if (fbStatus >= 200 && fbStatus < 300) {
    //                             return extractTextFromGeminiResponse(fbBody);
    //                         }
    //                     } catch (Exception fe) {
    //                         log.warn("Fallback call also failed: {}", fe.getMessage());
    //                     }

    //                     // Additional fallback: try using Application Default Credentials (service account) to get an OAuth token
    //                     try {
    //                         log.info("Attempting fallback with Application Default Credentials (ADC)");
    //                         GoogleCredentials creds = GoogleCredentials.getApplicationDefault().createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));
    //                         creds.refreshIfExpired();
    //                         AccessToken token = creds.getAccessToken();
    //                         if (token != null) {
    //                             String accessToken = token.getTokenValue();
    //                             HttpHeaders tokenHeaders = new HttpHeaders();
    //                             tokenHeaders.setContentType(MediaType.APPLICATION_JSON);
    //                             tokenHeaders.setAccept(List.of(MediaType.APPLICATION_JSON));
    //                             tokenHeaders.set("Authorization", "Bearer " + accessToken);
    //                             HttpEntity<String> tokenEntity = new HttpEntity<>(body, tokenHeaders);
    //                             ResponseEntity<String> tokenResp = restTemplate.postForEntity(url, tokenEntity, String.class);
    //                             int tStatus = tokenResp.getStatusCode().value();
    //                             String tBody = tokenResp.getBody() == null ? "" : tokenResp.getBody();
    //                             log.warn("ADC attempt returned status {} - body: {}", tStatus, tBody);
    //                             if (tStatus >= 200 && tStatus < 300) {
    //                                 return extractTextFromGeminiResponse(tBody);
    //                             }
    //                         } else {
    //                             log.warn("ADC did not return an access token");
    //                         }
    //                     } catch (Exception ge) {
    //                         log.warn("ADC fallback failed: {}", ge.getMessage());
    //                     }
    //                 }

    //                 if (attempt == maxAttempts) {
    //                     throw new RuntimeException(msg + ": " + responseBody);
    //                 }
    //             }
    //         } catch (Exception e) {
    //             log.warn("Gemini API call failed on attempt {}: {}", attempt, e.getMessage());
    //             if (attempt == maxAttempts) {
    //                 throw new RuntimeException("Gemini API call failed after retries: " + e.getMessage(), e);
    //             }
    //         }

    //         // backoff with jitter
    //         long jitter = (long) (Math.random() * 100);
    //         try {
    //             Thread.sleep(backoffMillis + jitter);
    //         } catch (InterruptedException ie) {
    //             Thread.currentThread().interrupt();
    //             throw new RuntimeException("Interrupted during retry backoff", ie);
    //         }
    //         backoffMillis *= 2;
    //     }

    //     throw new RuntimeException("Gemini API call failed (unreachable code)");
    // }
    public String callGemini(String prompt) throws Exception {
    // Build URL
    String baseUrl = apiUrl.endsWith("/") ? apiUrl + model + ":generateContent" : apiUrl + "/" + model + ":generateContent";

    // Build request JSON body (same shape you used)
    Map<String, Object> request = new HashMap<>();
    Map<String, Object> contents = new HashMap<>();
    Map<String, String> part = new HashMap<>();
    part.put("text", prompt);
    contents.put("parts", List.of(part));
    request.put("contents", List.of(contents));
    String body = objectMapper.writeValueAsString(request);

    // Prepare auth detection
    String effectiveApiKey = apiKey == null ? "" : apiKey.trim();
    String requestUrl = baseUrl;
    String bearerToken = null;
    boolean useQueryApiKey = false;
    boolean ambiguousApiKeyAsBearer = false;

    // Flags to avoid repeating fallback attempts
    boolean triedADC = false;
    boolean triedQueryKey = false;

    // Decide initial auth method
    if (effectiveApiKey.isBlank()) {
        log.info("No gemini.api.key provided; will attempt ADC (Application Default Credentials).");
        // Attempt to get ADC token now (best-effort). If it fails, we'll still attempt other fallbacks later.
        try {
            GoogleCredentials creds = GoogleCredentials.getApplicationDefault()
                .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));
            creds.refreshIfExpired();
            AccessToken token = creds.getAccessToken();
            if (token != null) {
                bearerToken = token.getTokenValue();
                triedADC = true;
                log.info("Using ADC for initial auth.");
            } else {
                log.info("ADC available but returned no access token.");
            }
        } catch (Exception e) {
            log.info("ADC not available for initial auth (will try again on 401/403).");
        }
    } else {
        // If looks like OAuth access token
        if (effectiveApiKey.startsWith("ya29.") || effectiveApiKey.startsWith("ya29_")) {
            bearerToken = effectiveApiKey;
            log.info("Using provided credential as OAuth access token (Bearer).");
        }
        // If looks like a Google API key
        else if (effectiveApiKey.startsWith("AIza") || (effectiveApiKey.length() >= 30 && effectiveApiKey.length() <= 60)) {
            requestUrl = baseUrl + (baseUrl.contains("?") ? "&" : "?") + "key=" + effectiveApiKey;
            useQueryApiKey = true;
            triedQueryKey = true;
            log.info("Using provided credential as Google API key (query param).");
        }
        // Ambiguous: try as Bearer but mark ambiguous so we can try query-key fallback later
        else {
            bearerToken = effectiveApiKey;
            ambiguousApiKeyAsBearer = true;
            log.info("Provided gemini.api.key is ambiguous; attempting to use it as Bearer token and will try ADC/query-key fallback on 401/403.");
        }
    }

    final int maxAttempts = 3;
    long backoffMillis = 500;

    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Build headers for this attempt
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            if (bearerToken != null && !useQueryApiKey) {
                headers.set("Authorization", "Bearer " + bearerToken);
            }
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            log.debug("Calling Gemini (attempt {}): {}", attempt, requestUrl);
            ResponseEntity<String> resp = restTemplate.postForEntity(requestUrl, entity, String.class);
            int status = resp.getStatusCode().value();
            String responseBody = resp.getBody() == null ? "" : resp.getBody();

            if (status >= 200 && status < 300) {
                String text = extractTextFromGeminiResponse(responseBody);
                log.debug("Gemini response received length={}", text == null ? 0 : text.length());
                return text;
            } else {
                String msg = String.format("Gemini returned non-success status %d", status);
                log.warn(msg + " - body: {}", responseBody);

                // If unauthorized, attempt prioritized fallbacks:
                // 1) If we haven't tried ADC yet, try ADC and retry immediately.
                // 2) If we used Bearer with ambiguous key, try query param with the original apiKey.
                // 3) If we used query param and it failed, try ADC (if not yet tried).
                if ((status == 401 || status == 403)) {
                    // Attempt ADC fallback if not tried
                    if (!triedADC) {
                        try {
                            log.info("Received {} - attempting ADC fallback.", status);
                            GoogleCredentials creds = GoogleCredentials.getApplicationDefault()
                                .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));
                            creds.refreshIfExpired();
                            AccessToken token = creds.getAccessToken();
                            if (token != null) {
                                bearerToken = token.getTokenValue();
                                // reset requestUrl to base (remove any ?key=... if present)
                                requestUrl = baseUrl;
                                triedADC = true;
                                log.info("ADC fallback obtained token; will retry with ADC Bearer token.");
                                // continue to next attempt (will retry)
                                continue;
                            } else {
                                log.warn("ADC fallback did not return an access token.");
                            }
                        } catch (Exception ge) {
                            log.warn("ADC fallback failed: {}", ge.getMessage());
                        }
                    }

                    // If we used ambiguous Bearer and haven't tried query-key yet, try query param
                    if (ambiguousApiKeyAsBearer && !triedQueryKey && !effectiveApiKey.isBlank()) {
                        try {
                            log.info("Received {} - attempting fallback using API key as query parameter.", status);
                            requestUrl = baseUrl + (baseUrl.contains("?") ? "&" : "?") + "key=" + effectiveApiKey;
                            // clear bearer header for query-key attempt
                            bearerToken = null;
                            triedQueryKey = true;
                            useQueryApiKey = true;
                            // retry immediately
                            continue;
                        } catch (Exception qe) {
                            log.warn("Query-key fallback failed to construct request: {}", qe.getMessage());
                        }
                    }

                    // If we used query param initially and it failed, try ADC (if not tried)
                    if (useQueryApiKey && !triedADC) {
                        try {
                            log.info("Query-key attempt failed with {} - trying ADC as fallback.", status);
                            GoogleCredentials creds = GoogleCredentials.getApplicationDefault()
                                .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));
                            creds.refreshIfExpired();
                            AccessToken token = creds.getAccessToken();
                            if (token != null) {
                                bearerToken = token.getTokenValue();
                                requestUrl = baseUrl; // switch back to bearer-based URL
                                triedADC = true;
                                useQueryApiKey = false;
                                log.info("ADC fallback obtained token; will retry with ADC Bearer token.");
                                continue;
                            } else {
                                log.warn("ADC fallback after query-key did not return an access token.");
                            }
                        } catch (Exception ge) {
                            log.warn("ADC fallback after query-key failed: {}", ge.getMessage());
                        }
                    }
                }

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
