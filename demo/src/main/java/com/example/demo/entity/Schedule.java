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

    private List<String> days;
    // Example: ["MONDAY","WEDNESDAY","FRIDAY"]

    private List<String> times;
    // Example: ["08:00","14:00","20:00"]

}