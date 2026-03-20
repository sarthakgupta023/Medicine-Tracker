package com.example.demo.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Document(collection = "logs")
@Data
public class Logs {

    @Id
    private String id;

    private String userId;

    private String medicineId;

    private String medicineName;

    private LocalDate date;

    private String time;

    private LocalDateTime scheduledTime;

    private boolean taken;

    private LocalDateTime takenAt;

    private String notes;
}