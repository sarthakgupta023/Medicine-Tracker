package com.example.demo.entity;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Document(collection = "schedules")
@Data
public class Schedule {

    @Id
    private String id;

    private String medicineId; // reference to Medicine

    private String userId;

    private List<String> days;
    // ["MONDAY", "WEDNESDAY", "FRIDAY"]
    // or ["EVERYDAY"] for daily medicines

    private List<String> times;
    // "Before Breakfast"
    // "After Breakfast"
    // "Before Lunch"
    // "After Lunch"
    // "Before Dinner"
    // "After Dinner"
}