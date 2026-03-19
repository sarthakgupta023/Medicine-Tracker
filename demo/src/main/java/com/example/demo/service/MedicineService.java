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

    public List<Medicine> getall(String id) {
        return medicineRepository.findByUserId(id);
    }
}
