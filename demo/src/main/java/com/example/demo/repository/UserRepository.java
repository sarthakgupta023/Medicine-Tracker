package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.entity.User;

public interface UserRepository extends MongoRepository<User, String> {

    // ✅ returns Optional<User> — correct
    // used by login to find user by email
    Optional<User> findByEmail(String email);
}