package com.shanu.backend.controller;

import com.shanu.backend.model.Alert;
import com.shanu.backend.model.Forecast;
import com.shanu.backend.model.Transaction;
import com.shanu.backend.repository.AlertRepository;
import com.shanu.backend.repository.ForecastRepository;
import com.shanu.backend.repository.TransactionRepository;
import com.shanu.backend.service.AuthService;
import com.shanu.backend.service.ForecastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.YearMonth;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:5173")
public class AnalyticsController {

    @Autowired
    private ForecastService forecastService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ForecastRepository forecastRepository;

    @Autowired
    private AuthService authService;

    /**
     * Get forecast for next month
     * GET /api/analytics/forecast
     */
    @GetMapping("/forecast")
    public ResponseEntity<?> getForecast(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String userId = authService.getUserFromToken(token.substring(7)).getId();

            // Get last 6 months of transactions
            LocalDate startDate = LocalDate.now().minusMonths(6);
            Date start = Date.from(startDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
            List<Transaction> transactions = transactionRepository.findByUserIdAndDateGreaterThan(userId, start);

            if (transactions.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "forecast", Map.of(),
                    "message", "Not enough data for forecast"
                ));
            }

            Map<String, Double> forecast = forecastService.forecastNextMonth(transactions);

            // Calculate total
            Double totalForecast = forecast.values().stream()
                .mapToDouble(Double::doubleValue)
                .sum();

            // Save forecast to DB
            Forecast forecastObj = new Forecast(userId, YearMonth.now().plusMonths(1).atDay(1).atStartOfDay(), 
                forecast, new HashMap<>(), totalForecast);
            forecastRepository.save(forecastObj);

            return ResponseEntity.ok(Map.of(
                "forecast", forecast,
                "totalForecast", totalForecast
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "http://localhost:5173")
class AlertController {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private AuthService authService;

    /**
     * Get all alerts for user
     * GET /api/alerts/list
     */
    @GetMapping("/list")
    public ResponseEntity<?> getAlerts(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String userId = authService.getUserFromToken(token.substring(7)).getId();
            List<Alert> alerts = alertRepository.findByUserIdOrderByCreatedAtDesc(userId);

            return ResponseEntity.ok(Map.of("alerts", alerts));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark alert as read
     * POST /api/alerts/{id}/mark-read
     */
    @PostMapping("/{id}/mark-read")
    public ResponseEntity<?> markAsRead(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            Optional<Alert> alertOpt = alertRepository.findById(id);
            if (alertOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Alert not found"));
            }

            Alert alert = alertOpt.get();
            alert.setIsRead(true);
            alertRepository.save(alert);

            return ResponseEntity.ok(Map.of("success", true));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
