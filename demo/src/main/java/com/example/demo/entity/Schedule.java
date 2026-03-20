package com.example.demo.entity;

import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Document(collection = "schedules")
@Data
public class Schedule {

    @Id
    private String id;

    private String medicineId; // reference to Medicine — never change after creation

    private String userId; // reference to User — never change after creation

    private List<String> days;
    // ["MONDAY", "WEDNESDAY", "FRIDAY"]

    private List<String> times;
    // flat unique list of all timings across all days
    // ["Before Breakfast", "After Dinner", "Before Lunch"]

    private Map<String, List<String>> dayTimesMap;
    // per day timing map
    // {
    // "MON": ["Before Breakfast", "After Dinner"],
    // "WED": ["Before Lunch"],
    // "FRI": ["Before Breakfast"]
    // }
}