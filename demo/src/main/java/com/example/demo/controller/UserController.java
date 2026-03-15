package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.User;
import com.example.demo.service.UserService;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    // Signup User
    @PostMapping("/signup")
    public User signup(@RequestBody User user) {

        return userService.saveUser(user);

    }

    // Get User by ID
    @GetMapping("/{id}")
    public User getUser(@PathVariable String id) {

        return userService.getUser(id);

    }

    // Update Password
    @PutMapping("/updatePassword")
    public User updatePassword(@RequestParam String email,
            @RequestParam String newPassword) {

        return userService.updatePassword(email, newPassword);

    }

}