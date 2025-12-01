package com.shanu.backend.controller;

import com.shanu.backend.model.AiHistory;
import com.shanu.backend.model.Transaction;
import com.shanu.backend.repository.AiHistoryRepository;
import com.shanu.backend.repository.TransactionRepository;
import com.shanu.backend.service.AiService;
import com.shanu.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AiController {

    @Autowired
    private AiService aiService;

    @Autowired
    private AiHistoryRepository aiHistoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private com.shanu.backend.service.TipService tipService;
    @Autowired
    private AuthService authService;

    /**
     * Generate AI-powered advice
     * POST /api/ai/advice
     * Body: { "scope": "monthly" | "yearly" | "detailed" }
     */
    @PostMapping("/advice")
    public ResponseEntity<?> generateAdvice(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody Map<String, String> request) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String userId = authService.getUserFromToken(token.substring(7)).getId();
            String scope = request.getOrDefault("scope", "monthly");

            // Get user transactions from last 3-6 months depending on scope
            LocalDate startDate = "yearly".equals(scope) ? 
                LocalDate.now().minusMonths(12) : 
                LocalDate.now().minusMonths(3);

            Date start = Date.from(startDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
            List<Transaction> transactions = transactionRepository.findByUserIdAndDateGreaterThan(userId, start);

            if (transactions.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "summary", "No transactions found. Start tracking expenses to get personalized advice.",
                    "actions", List.of(),
                    "estimatedSavingsNextMonth", 0,
                    "confidenceScore", 0,
                    "citations", List.of()
                ));
            }

            // If AI feature is disabled or not configured, return rule-based tips as fallback
            if (!aiService.isAiEnabled()) {
                Map<String, Object> tipResult = tipService.recommendTips(transactions);
                List<String> tips = new ArrayList<>();
                Object tipsObj = tipResult.getOrDefault("tips", List.of());
                if (tipsObj instanceof List) {
                    for (Object o : (List<?>) tipsObj) if (o != null) tips.add(o.toString());
                }

                String summary = tips.isEmpty() ? "No personalized tips available" : String.join("; ", tips.subList(0, Math.min(3, tips.size())));
                List<String> actions = tips;
                Double estimatedSavings = 0.0;
                Integer confidenceScore = 60;
                List<String> citations = List.of("rule-based");

                AiHistory history = new AiHistory(userId, scope, summary, actions, estimatedSavings, confidenceScore, citations);
                aiHistoryRepository.save(history);

                return ResponseEntity.ok(Map.of(
                    "summary", summary,
                    "actions", actions,
                    "estimatedSavingsNextMonth", estimatedSavings,
                    "confidenceScore", confidenceScore,
                    "citations", citations,
                    "source", "rule-based"
                ));
            }

            // Call AI service
            Map<String, Object> aiResponse = aiService.generatePersonalizedAdvice(userId, transactions);

            // If AI returned error, fall back to rule-based tips
            if (aiResponse == null || aiResponse.containsKey("error")) {
                Map<String, Object> tipResult = tipService.recommendTips(transactions);
                List<String> tips = new ArrayList<>();
                Object tipsObj = tipResult.getOrDefault("tips", List.of());
                if (tipsObj instanceof List) {
                    for (Object o : (List<?>) tipsObj) if (o != null) tips.add(o.toString());
                }

                String summary = "AI unavailable — showing rule-based suggestions.";
                List<String> actions = tips;
                Double estimatedSavings = 0.0;
                Integer confidenceScore = 50;
                List<String> citations = List.of("fallback");

                AiHistory history = new AiHistory(userId, scope, summary, actions, estimatedSavings, confidenceScore, citations);
                aiHistoryRepository.save(history);

                return ResponseEntity.ok(Map.of(
                    "summary", summary,
                    "actions", actions,
                    "estimatedSavingsNextMonth", estimatedSavings,
                    "confidenceScore", confidenceScore,
                    "citations", citations,
                    "source", "fallback"
                ));
            }

            // Extract structured response from AI
            String summary = (String) aiResponse.getOrDefault("summary", "Unable to generate summary");
            Object actionsObj = aiResponse.getOrDefault("actions", List.of());
            List<String> actions = new ArrayList<>();
            if (actionsObj instanceof List) {
                for (Object o : (List<?>) actionsObj) if (o != null) actions.add(o.toString());
            }

            Double estimatedSavings = 0.0;
            Object estObj = aiResponse.getOrDefault("estimatedSavingsNextMonth", 0);
            if (estObj instanceof Number) estimatedSavings = ((Number) estObj).doubleValue();

            Integer confidenceScore = 50;
            Object confObj = aiResponse.getOrDefault("confidenceScore", 50);
            if (confObj instanceof Number) confidenceScore = ((Number) confObj).intValue();

            Object citationsObj = aiResponse.getOrDefault("citations", List.of());
            List<String> citations = new ArrayList<>();
            if (citationsObj instanceof List) {
                for (Object o : (List<?>) citationsObj) if (o != null) citations.add(o.toString());
            }

            // Save to history
            AiHistory history = new AiHistory(userId, scope, summary, actions, estimatedSavings, confidenceScore, citations);
            aiHistoryRepository.save(history);

            return ResponseEntity.ok(Map.of(
                "summary", summary,
                "actions", actions,
                "estimatedSavingsNextMonth", estimatedSavings,
                "confidenceScore", confidenceScore,
                "citations", citations,
                "source", "ai"
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get AI history for user
     * GET /api/ai/history
     */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String userId = authService.getUserFromToken(token.substring(7)).getId();
            List<AiHistory> history = aiHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);

            return ResponseEntity.ok(Map.of("history", history));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get specific AI history entry
     * GET /api/ai/history/{id}
     */
    @GetMapping("/history/{id}")
    public ResponseEntity<?> getHistoryEntry(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            Optional<AiHistory> history = aiHistoryRepository.findById(id);
            if (history.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Not found"));
            }

            return ResponseEntity.ok(history.get());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
