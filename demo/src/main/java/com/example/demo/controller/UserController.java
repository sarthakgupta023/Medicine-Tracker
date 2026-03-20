package com.example.demo.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
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

@CrossOrigin("*")
@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    // Signup User
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        Optional<User> already = userService.getUserByEmail(user.getEmail());
        if (already.isEmpty() == false) {
            return ResponseEntity.badRequest().body("false");
        }
        User saved_user = userService.saveUser(user);
        return ResponseEntity.ok().body("true");
    }

    // login user
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        Optional<User> temp = userService.getUserByEmail(user.getEmail());
        if (temp.isEmpty()) {
            return ResponseEntity.badRequest().body("User doesn't Exist");
        }
        User actaul_user = temp.get();
        String password = user.getPassword();
        if (actaul_user.getPassword().equals(password)) {
            // here comes our token response system;
            return ResponseEntity.ok().body(null);
        } else {
            return ResponseEntity.badRequest().body("Wrong Credentials");
        }
    }

    // Get User by ID
    @GetMapping("/{id}")
    public User getUser(@PathVariable String id) {
        return userService.getUser(id);
    }

    @GetMapping("/getall")
    public List<User> getall() {
        return userService.getall();
    }

    // Update Password
    @PutMapping("/updatePassword")
    public User updatePassword(@RequestParam String email, @RequestParam String newPassword) {
        return userService.updatePassword(email, newPassword);
    }

    @GetMapping("/medicine/{id}")
    public List<String> get_medicine(@PathVariable String id) {

    }

}