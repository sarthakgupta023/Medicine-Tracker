package com.example.demo.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.entity.Schedule;

public interface ScheduleRepository extends MongoRepository<Schedule, String> {

}
