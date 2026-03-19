package com.example.demo.service;

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

    // save user
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    // get user
    public User getUser(String id) {

        Optional<User> user = userRepository.findById(id);

        return user.orElse(null);
    }

    public List<User> getall() {

        return userRepository.findAll();
    }

    // Get user by email (for login)
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email); // directly return Optional
    }

    // Update password
    public User updatePassword(String email, String newPassword) {

        User user = userRepository.findByEmail(email);

        if (user != null) {
            user.setPassword(newPassword);
            return userRepository.save(user);
        }
        return null;

    }
}
