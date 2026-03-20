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

    // ── save new OR update existing (delete old + save new)
    public Schedule saveOrUpdate(Schedule schedule) {
        Schedule existing = scheduleRepository.findByMedicineId(schedule.getMedicineId());

        if (existing != null) {
            // exists → delete old first
            scheduleRepository.deleteByMedicineId(schedule.getMedicineId());
        }

        // save (works for both new and updated)
        return scheduleRepository.save(schedule);
    }

    // ── get schedule by medicineId
    public Schedule getByMedicineId(String medicineId) {
        return scheduleRepository.findByMedicineId(medicineId);
    }

    // ── get ALL schedules for a user ✅ needed by home page
    public List<Schedule> getByUserId(String userId) {
        return scheduleRepository.findByUserId(userId);
    }

    // ── delete schedule by medicineId
    public void deleteByMedicineId(String medicineId) {
        scheduleRepository.deleteByMedicineId(medicineId);
    }
}