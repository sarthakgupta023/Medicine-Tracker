package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.Logs;
import com.example.demo.service.LogsService;

@RestController
@RequestMapping("/logs")
@CrossOrigin("*")
public class LogsController {
    @Autowired
    private LogsService logsService;

    @GetMapping("/{id}/{todaysdate}")
    public List<Logs> getbyidanddate(@PathVariable String id, @PathVariable String todaysdate) {
        return logsService.get_by_id_date(id, todaysdate);
    }

    @PostMapping("/taken")
    public Logs save(@RequestBody Logs log) {
        return logsService.save(log);
    }

}
