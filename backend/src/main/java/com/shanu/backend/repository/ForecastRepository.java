package com.shanu.backend.repository;

import com.shanu.backend.model.Forecast;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface ForecastRepository extends MongoRepository<Forecast, String> {
    List<Forecast> findByUserIdOrderByForecastMonthDesc(String userId);
    Forecast findByUserIdAndForecastMonth(String userId, LocalDateTime forecastMonth);
}
