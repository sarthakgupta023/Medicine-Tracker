package com.example.demo.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.entity.Schedule;

public interface ScheduleRepository extends MongoRepository<Schedule, String> {

    Schedule findByMedicineId(String medicineId);

    List<Schedule> findByUserId(String userId);
}