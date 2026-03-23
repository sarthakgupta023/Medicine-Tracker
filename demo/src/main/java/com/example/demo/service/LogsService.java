package com.example.demo.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.demo.entity.Logs;
import com.example.demo.repository.LogsRepository;

@Component
public class LogsService {
    @Autowired
    private LogsRepository logsRepository;

    public List<Logs> get_by_id_date(String id, String takendate) {
        return logsRepository.findByUserIdAndTakenDate(id, takendate);
    }

    public Logs save(Logs log) {
        return logsRepository.save(log);
    }
}
