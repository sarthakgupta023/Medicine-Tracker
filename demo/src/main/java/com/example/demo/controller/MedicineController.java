package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.Medicine;
import com.example.demo.service.MedicineService;

@CrossOrigin("*")
@RestController
@RequestMapping("/medicine")
public class MedicineController {

    @Autowired
    private MedicineService medicineService;

    @GetMapping("/getall")
    public List<Medicine> getall() {
        List<Medicine> medicines = medicineService.get();
        return medicines;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMedicines(@PathVariable String id) {
        List<Medicine> medicines = medicineService.getall(id);
        if (medicines.isEmpty()) {
            return ResponseEntity.status(404).body("No medicines found for this user");
        }
        return ResponseEntity.ok(medicines);
    }

    // ── POST add new medicine
    @PostMapping("/add")
    public ResponseEntity<?> addMedicine(@RequestBody Medicine medicine) {
        try {
            medicine.setCreatedAt(LocalDateTime.now());
            medicine.setActive(true);

            Medicine saved = medicineService.addMedicine(medicine);
            return ResponseEntity.ok(saved); // returns saved medicine with generated id

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to save medicine: " + e.getMessage());
        }
    }
}