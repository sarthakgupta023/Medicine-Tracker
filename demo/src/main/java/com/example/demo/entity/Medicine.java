package com.example.demo.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Document(collection = "medicines")
@Data
public class Medicine {

    @Id
    private String id;

    private String userId; // reference to User

    private String name;

    private int quantity; // remaining tablets

    private LocalDate startDate;

    private int durationDays; // how many days medicine continues

    private int gapDays; // gap between doses

    private LocalDateTime createdAt;
}