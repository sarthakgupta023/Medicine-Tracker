package com.example.demo.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.entity.Medicine;

public interface MedicineRepository extends MongoRepository<Medicine, String> {
    List<Medicine> findByUserId(String userId);
}
