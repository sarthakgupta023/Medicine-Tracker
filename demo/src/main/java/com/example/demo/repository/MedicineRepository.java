package com.example.demo.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.entity.Medicine;

public interface MedicineRepository extends MongoRepository<Medicine, String> {

    // ── get all medicines for a user
    List<Medicine> findByUserId(String userId);

    // ✅ REMOVED — deleteByMedicineId() was wrong
    // Medicine has field "id" not "medicineId"
    // use deleteById() which is already in MongoRepository

    // ✅ REMOVED — findById() already exists in MongoRepository
    // it returns Optional<Medicine> — use that directly
    // redefining it causes type conflict
}