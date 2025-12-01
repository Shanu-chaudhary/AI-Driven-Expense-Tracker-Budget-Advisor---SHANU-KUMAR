package com.shanu.backend.controller;

import com.shanu.backend.model.Transaction;
import com.shanu.backend.repository.TransactionRepository;
import com.shanu.backend.service.TipService;
import com.shanu.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/tips")
@CrossOrigin(origins = "http://localhost:5173")
public class TipController {

    @Autowired
    private TipService tipService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuthService authService;

    /**
     * Get personalized tips based on spending
     * GET /api/tips/recommend
     */
    @GetMapping("/recommend")
    public ResponseEntity<?> getTips(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String userId = authService.getUserFromToken(token.substring(7)).getId();

            // Get last 3 months of transactions
            LocalDate startDate = LocalDate.now().minusMonths(3);
            Date start = Date.from(startDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
            List<Transaction> transactions = transactionRepository.findByUserIdAndDateGreaterThan(userId, start);

            if (transactions.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "tips", List.of("Start tracking your expenses to get personalized tips!"),
                    "analysis", Map.of()
                ));
            }

            Map<String, Object> result = tipService.recommendTips(transactions);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
