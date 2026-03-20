package com.example.demo.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
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

    // ── Signup
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        try {
            System.out.println("=== SIGNUP HIT ===");
            System.out.println("Name: " + user.getName());
            System.out.println("Email: " + user.getEmail());
            System.out.println("Password: " + user.getPassword());

            // ✅ validate fields before doing anything
            if (user.getEmail() == null || user.getEmail().isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }
            if (user.getName() == null || user.getName().isEmpty()) {
                return ResponseEntity.badRequest().body("Name is required");
            }
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required");
            }

            // ✅ check if email already exists
            Optional<User> already = userService.getUserByEmail(user.getEmail());
            System.out.println("Already exists: " + already.isPresent());

            if (already.isPresent()) {
                return ResponseEntity.badRequest().body("false");
            }

            // ✅ save user — lowercase + createdAt set inside service
            userService.saveUser(user);
            return ResponseEntity.ok().body("true");

        } catch (DuplicateKeyException e) {
            // ✅ catches MongoDB duplicate index error
            // happens even when collection cleared but index still exists
            System.out.println("Duplicate key: " + e.getMessage());
            return ResponseEntity.badRequest().body("false");

        } catch (Exception e) {
            System.out.println("Signup exception: " + e.getMessage());
            return ResponseEntity.status(500).body("Signup failed: " + e.getMessage());
        }
    }

    // ── Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        try {
            System.out.println("=== LOGIN HIT ===");
            System.out.println("Email: " + user.getEmail());
            System.out.println("Password: " + user.getPassword());

            if (user.getEmail() == null || user.getEmail().isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }

            // ✅ find by email
            Optional<User> temp = userService.getUserByEmail(user.getEmail());
            System.out.println("User found: " + temp.isPresent());

            if (temp.isEmpty()) {
                return ResponseEntity.status(404).body("User doesn't Exist");
            }

            User actualUser = temp.get();

            // ✅ check password
            if (!actualUser.getPassword().equals(user.getPassword())) {
                System.out.println("Password mismatch");
                return ResponseEntity.status(401).body("Wrong Credentials");
            }

            System.out.println("Login success for: " + actualUser.getEmail());

            // ✅ return userId + email + token
            // token = userId for now — replace with real JWT later
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", actualUser.getId(),
                    "userId", actualUser.getId(),
                    "email", actualUser.getEmail(),
                    "message", "Login Successful"));

        } catch (Exception e) {
            System.out.println("Login exception: " + e.getMessage());
            return ResponseEntity.status(500).body("Login failed: " + e.getMessage());
        }
    }

    // ── Get User by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        User user = userService.getUser(id);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        return ResponseEntity.ok(user);
    }

    // ── Get All Users
    @GetMapping("/getall")
    public ResponseEntity<?> getall() {
        return ResponseEntity.ok(userService.getall());
    }

    // ── Update Password
    @PutMapping("/updatePassword")
    public ResponseEntity<?> updatePassword(
            @RequestParam String email,
            @RequestParam String newPassword) {
        try {
            User updated = userService.updatePassword(email, newPassword);
            if (updated == null) {
                return ResponseEntity.status(404).body("User not found");
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Update failed: " + e.getMessage());
        }
    }
}