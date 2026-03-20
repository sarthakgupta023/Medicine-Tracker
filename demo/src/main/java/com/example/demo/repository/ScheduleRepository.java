package com.example.demo.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.entity.Schedule;

public interface ScheduleRepository extends MongoRepository<Schedule, String> {

    // ── get schedule by medicineId
    Schedule findByMedicineId(String medicineId);

    // ── get all schedules for a user
    List<Schedule> findByUserId(String userId);

    // ✅ added — needed for delete + saveOrUpdate
    void deleteByMedicineId(String medicineId);
}