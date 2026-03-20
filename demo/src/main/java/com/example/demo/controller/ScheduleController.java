package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.Schedule;
import com.example.demo.service.ScheduleService;

@CrossOrigin("*")
@RestController
@RequestMapping("/schedule")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    // ── POST add or update schedule (saveOrUpdate handles both)
    @PostMapping("/add") // ✅ removed duplicate
    public ResponseEntity<?> addSchedule(@RequestBody Schedule schedule) {
        try {
            Schedule saved = scheduleService.saveOrUpdate(schedule);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to save schedule: " + e.getMessage());
        }
    }

    // ── GET schedule by medicineId
    @GetMapping("/{medicineId}")
    public ResponseEntity<?> getSchedule(@PathVariable String medicineId) {
        Schedule schedule = scheduleService.getByMedicineId(medicineId);
        if (schedule == null) {
            return ResponseEntity.status(404).body("Schedule not found");
        }
        return ResponseEntity.ok(schedule);
    }

    // ── GET all schedules by userId
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getSchedulesByUser(@PathVariable String userId) {
        List<Schedule> schedules = scheduleService.getByUserId(userId);
        if (schedules.isEmpty()) {
            return ResponseEntity.status(404).body("No schedules found");
        }
        return ResponseEntity.ok(schedules);
    }

    // ── DELETE schedule by medicineId
    @DeleteMapping("/delete/{medicineId}")
    public ResponseEntity<?> deleteSchedule(@PathVariable String medicineId) {
        try {
            scheduleService.deleteByMedicineId(medicineId);
            return ResponseEntity.ok("Schedule deleted");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to delete schedule: " + e.getMessage());
        }
    }
}