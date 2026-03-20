package com.example.demo.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.demo.entity.Medicine;
import com.example.demo.repository.MedicineRepository;

@Component
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    // ── get all medicines for a user
    public List<Medicine> getall(String userId) {
        return medicineRepository.findByUserId(userId);
    }

    public List<Medicine> get() {
        return medicineRepository.find();
    }

    // ── save new medicine
    public Medicine addMedicine(Medicine medicine) {
        return medicineRepository.save(medicine);
    }
}