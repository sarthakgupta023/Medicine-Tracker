package com.example.demo.entity;

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
    private String takenDate; // "2026-03-23" format
    private LocalDateTime takenAt;
    private String timing;
}