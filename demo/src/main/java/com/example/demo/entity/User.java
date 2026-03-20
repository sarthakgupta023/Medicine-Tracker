package com.example.demo.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Document(collection = "users")
@Data
public class User {

    @Id
    private String id;

    @NotBlank
    private String name;

    @NotBlank
    @Indexed(unique = true) // ✅ prevents duplicate emails in DB
    private String email;

    @NotBlank
    private String password;

    private LocalDateTime createdAt; // ✅ set automatically at signup
}