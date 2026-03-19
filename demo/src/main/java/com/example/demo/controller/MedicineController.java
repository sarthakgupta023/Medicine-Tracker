package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.Medicine;
import com.example.demo.service.MedicineService;

@CrossOrigin("*")
@RestController
@RequestMapping("/medicine")
public class MedicineController {
    @Autowired
    private MedicineService MedicineService;

    @GetMapping("/{id}")
    public List<Medicine> getMethodName(@PathVariable String id) {
        return MedicineService.getall(id);
    }
}
