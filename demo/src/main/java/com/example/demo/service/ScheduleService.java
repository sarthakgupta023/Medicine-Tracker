package com.example.demo.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.demo.entity.Schedule;
import com.example.demo.repository.ScheduleRepository;

@Component
public class ScheduleService {

    @Autowired
    private ScheduleRepository scheduleRepository;

    // ── save new schedule
    public Schedule addSchedule(Schedule schedule) {
        return scheduleRepository.save(schedule);
    }

    // ── get schedule by medicineId
    public Schedule getByMedicineId(String medicineId) {
        return scheduleRepository.findByMedicineId(medicineId);
    }

    // ── get all schedules for a user
    public List<Schedule> getByUserId(String userId) {
        return scheduleRepository.findByUserId(userId);
    }
}