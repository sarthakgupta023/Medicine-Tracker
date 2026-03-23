package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
    public ResponseEntity<?> getall() {
        List<Medicine> medicines = medicineService.get();
        return ResponseEntity.ok(medicines);
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
            Medicine saved = medicineService.addMedicine(medicine);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to save medicine: " + e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateMedicine(
            @PathVariable String id,
            @RequestBody Medicine medicine) {
        try {

            Medicine updated = medicineService.updateMedicine(id, medicine);
            if (updated == null) {
                return ResponseEntity.status(404).body("Medicine not found");
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update medicine: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteMedicine(@PathVariable String id) {
        try {
            medicineService.deleteMedicine(id);
            return ResponseEntity.ok("Medicine deleted");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to delete medicine: " + e.getMessage());
        }
    }
}