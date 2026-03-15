package com.example.demo.service;

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
        return userRepo.save(user);
    }

    // get user
    public User getUser(String id) {

        Optional<User> user = userRepo.findById(id);

        return user.orElse(null);
    }

    // Get user by email (for login)
    public User getUserByEmail(String email) {

        return userRepo.findByEmail(email);

    }

    // Update password
    public User updatePassword(String email, String newPassword) {

        User user = userRepo.findByEmail(email);

        if (user != null) {
            user.setPassword(newPassword);
            return userRepo.save(user);
        }
        return null;

    }
}
