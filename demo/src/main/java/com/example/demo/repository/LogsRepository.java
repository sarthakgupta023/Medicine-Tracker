package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.entity.Logs;

public interface LogsRepository extends MongoRepository<Logs, String> {
    List<Logs> findByUserIdAndTakenDate(String uerId, String takenDate);

    Optional<Logs> findByUserIdAndMedicineIdAndTakenDateAndTiming(
            String userId, String medicineId, String takenDate, String timing);
}
