package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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

    // ── get all medicines (no filter — for testing)
    public List<Medicine> get() {
        return medicineRepository.findAll();
    }

    // ── get medicine by id ✅ fixed — takes id as param
    public Optional<Medicine> getByMedicineId(String id) {
        return medicineRepository.findById(id);
    }

    // ── save new medicine ✅ sets createdAt + active + endDate
    public Medicine addMedicine(Medicine medicine) {
        medicine.setCreatedAt(LocalDateTime.now());
        medicine.setActive(true);

        // ✅ auto calculate endDate if startDate + durationDays provided
        if (medicine.getStartDate() != null && medicine.getDurationDays() > 0) {
            medicine.setEndDate(
                    medicine.getStartDate().plusDays(medicine.getDurationDays()));
        }

        return medicineRepository.save(medicine);
    }

    // ── update medicine — only quantity for now ✅ fixed return statement
    public Medicine updateMedicine(String id, Medicine medicine) {
        Optional<Medicine> existing = getByMedicineId(id);

        // ✅ return null if not found — controller handles 404
        if (existing.isEmpty())
            return null;

        Medicine old = existing.get();

        // ✅ only update quantity — keep everything else unchanged
        old.setQuantity(medicine.getQuantity());

        return medicineRepository.save(old);
    }

    // ── delete medicine by id
    public void deleteMedicine(String id) {
        medicineRepository.deleteById(id);
    }
}