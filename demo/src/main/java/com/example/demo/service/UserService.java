package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;

@Component
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // ── Save / Signup user
    public User saveUser(User user) {

        // ✅ always lowercase + trim email before saving
        user.setEmail(user.getEmail().toLowerCase().trim());

        // ✅ trim name and password too
        user.setName(user.getName().trim());
        user.setPassword(user.getPassword().trim());

        // ✅ auto set createdAt
        user.setCreatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    // ── Get user by ID
    public User getUser(String id) {
        Optional<User> user = userRepository.findById(id);
        return user.orElse(null);
    }

    // ── Get all users
    public List<User> getall() {
        return userRepository.findAll();
    }

    // ── Get user by email (for login + signup check)
    public Optional<User> getUserByEmail(String email) {
        // ✅ always lowercase before searching
        return userRepository.findByEmail(email.toLowerCase().trim());
    }

    // ── Update password
    public User updatePassword(String email, String newPassword) {
        Optional<User> temp = getUserByEmail(email);
        if (temp.isEmpty())
            return null;

        User user = temp.get();
        user.setPassword(newPassword.trim());
        return userRepository.save(user);
    }
}