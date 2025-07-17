/*package org.hyper.notificationbackend.controllers;

import org.hyper.notificationbackend.services.ContentScheduleService;
import org.hyper.notificationbackend.services.TVEnumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    @Autowired
    private TVEnumService tvService;
    
    @Autowired
    private ContentScheduleService contentScheduleService;
    
    // Get dashboard data with TVs and their upcoming schedules
    @GetMapping
    public ResponseEntity<?> getDashboardData() {
        try {
            List<Map<String, Object>> dashboardData = new ArrayList<>();
            List<TVEnum> tvs = tvService.getAllTVs();
            
            for (TVEnum tv : tvs) {
                Map<String, Object> tvData = new HashMap<>();
                tvData.put("tv", tv);
                tvData.put("upcomingSchedules", contentScheduleService.getUpcomingSchedulesForTV(tv.getId()));
                tvData.put("currentSchedules", contentScheduleService.getCurrentlyActiveSchedules());
                dashboardData.add(tvData);
            }
            
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    // Get current system status
    @GetMapping("/status")
    public ResponseEntity<?> getSystemStatus() {
        try {
            Map<String, Object> statusData = new HashMap<>();
            statusData.put("currentTime", LocalDateTime.now());
            statusData.put("activeSchedules", contentScheduleService.getCurrentlyActiveSchedules().size());
            statusData.put("upcomingSchedules", contentScheduleService.getUpcomingSchedules().size());
            statusData.put("totalTVs", tvService.getAllTVs().size());
            
            return ResponseEntity.ok(statusData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
*/