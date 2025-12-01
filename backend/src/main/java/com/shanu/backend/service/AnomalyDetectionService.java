package com.shanu.backend.service;

import com.shanu.backend.model.Alert;
import com.shanu.backend.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnomalyDetectionService {

    @Autowired
    private AlertRepository alertRepository;

    /**
     * Detect anomalies using z-score method
     */
    public List<Alert> detectAnomalies(String userId, Map<String, List<Double>> categoryHistory) {
        List<Alert> alerts = new ArrayList<>();

        for (Map.Entry<String, List<Double>> entry : categoryHistory.entrySet()) {
            String category = entry.getKey();
            List<Double> values = entry.getValue();

            if (values.size() < 2) continue;

            Double lastValue = values.get(values.size() - 1);
            Double zScore = calculateZScore(values, lastValue);

            // Trigger alert if z-score > 2 (unusual)
            if (Math.abs(zScore) > 2.0) {
                Double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                String message = String.format(
                    "Unusual %s spending detected: %.2f (avg: %.2f, z-score: %.2f)",
                    category, lastValue, mean, zScore
                );

                Alert alert = new Alert(userId, "spending_spike", message, category, lastValue, mean);
                alerts.add(alert);
            }
        }

        // Save alerts to DB
        alertRepository.saveAll(alerts);
        return alerts;
    }

    /**
     * Calculate z-score for anomaly detection
     */
    private Double calculateZScore(List<Double> values, Double value) {
        if (values.size() < 2) return 0.0;

        Double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        Double variance = values.stream()
            .mapToDouble(v -> Math.pow(v - mean, 2))
            .average()
            .orElse(0.0);

        Double stdDev = Math.sqrt(variance);
        return stdDev > 0 ? (value - mean) / stdDev : 0.0;
    }

    /**
     * Detect anomalies using Median Absolute Deviation (MAD)
     */
    public List<Alert> detectAnomaliesMAD(String userId, Map<String, List<Double>> categoryHistory) {
        List<Alert> alerts = new ArrayList<>();

        for (Map.Entry<String, List<Double>> entry : categoryHistory.entrySet()) {
            String category = entry.getKey();
            List<Double> values = entry.getValue();

            if (values.size() < 3) continue;

            Double lastValue = values.get(values.size() - 1);
            Double median = calculateMedian(values);
            Double mad = calculateMAD(values, median);

            // Modified z-score using MAD
            Double modifiedZScore = 0.6745 * (lastValue - median) / mad;

            if (Math.abs(modifiedZScore) > 3.5) {
                String message = String.format(
                    "Outlier %s spending detected: %.2f (median: %.2f, MAD: %.2f)",
                    category, lastValue, median, mad
                );

                Alert alert = new Alert(userId, "spending_spike", message, category, lastValue, median);
                alerts.add(alert);
            }
        }

        alertRepository.saveAll(alerts);
        return alerts;
    }

    /**
     * Calculate median
     */
    private Double calculateMedian(List<Double> values) {
        List<Double> sorted = values.stream().sorted().collect(Collectors.toList());
        int size = sorted.size();
        
        if (size % 2 == 0) {
            return (sorted.get(size / 2 - 1) + sorted.get(size / 2)) / 2;
        } else {
            return sorted.get(size / 2);
        }
    }

    /**
     * Calculate Median Absolute Deviation
     */
    private Double calculateMAD(List<Double> values, Double median) {
        List<Double> deviations = values.stream()
            .map(v -> Math.abs(v - median))
            .collect(Collectors.toList());
        
        return calculateMedian(deviations);
    }
}
