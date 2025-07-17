package org.hyper.notificationbackend.controllers;

import org.hyper.notificationbackend.models.ContentSchedule;
import org.hyper.notificationbackend.models.TVEnum;
import org.hyper.notificationbackend.services.ContentScheduleService;
import org.hyper.notificationbackend.dto.ContentScheduleRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/content")
public class ContentScheduleController {

    @Autowired
    private ContentScheduleService contentScheduleService;
    
    // Create a new content schedule
    @PostMapping
    public ResponseEntity<?> createContentSchedule(@RequestBody ContentSchedule contentSchedule) {
        try {
            ContentSchedule newSchedule = contentScheduleService.createSchedule(contentSchedule);
            return ResponseEntity.ok(newSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    // Create a new content schedule from DTO (supports multiple time schedules)
    @PostMapping("/from-request")
    public ResponseEntity<?> createContentScheduleFromRequest(@RequestBody ContentScheduleRequest request) {
        try {
            ContentSchedule newSchedule = contentScheduleService.createScheduleFromRequest(request);
            return ResponseEntity.ok(newSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    // Get all content schedules
    @GetMapping("/all")
    public ResponseEntity<List<ContentSchedule>> getAllContentSchedules() {
        return ResponseEntity.ok(contentScheduleService.getAllSchedules());
    }
    
    // Get content schedule by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getContentScheduleById(@PathVariable("id") Long id) {
        Optional<ContentSchedule> schedule = contentScheduleService.getScheduleById(id);
        return schedule.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Get currently active schedules
    @GetMapping("/active")
    public ResponseEntity<List<ContentSchedule>> getCurrentlyActiveSchedules() {
        return ResponseEntity.ok(contentScheduleService.getCurrentlyActiveSchedules());
    }
    
    // Get upcoming schedules
    @GetMapping("/upcoming")
    public ResponseEntity<List<ContentSchedule>> getUpcomingSchedules() {
        return ResponseEntity.ok(contentScheduleService.getUpcomingSchedules());
    }
    
    // Get immediate/indefinite schedules
    @GetMapping("/immediate")
    public ResponseEntity<List<ContentSchedule>> getImmediateSchedules() {
        return ResponseEntity.ok(contentScheduleService.getImmediateSchedules());
    }
    
    // Get schedules for a specific TV
    @GetMapping("/tv/{tvName}")
    public ResponseEntity<?> getSchedulesForTV(@PathVariable("tvName") String tvName) {
        try {
            TVEnum tv = TVEnum.valueOf(tvName);
            return ResponseEntity.ok(contentScheduleService.getSchedulesForTV(tv));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid TV name: " + tvName);
        }
    }
    
    // Get upcoming schedules for a specific TV
    @GetMapping("/tv/{tvName}/upcoming")
    public ResponseEntity<?> getUpcomingSchedulesForTV(@PathVariable("tvName") String tvName) {
        try {
            TVEnum tv = TVEnum.valueOf(tvName);
            return ResponseEntity.ok(contentScheduleService.getUpcomingSchedulesForTV(tv));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid TV name: " + tvName);
        }
    }
    
    // Update a content schedule
    @PutMapping("/{id}")
    public ResponseEntity<?> updateContentSchedule(@PathVariable("id") Long id, @RequestBody ContentSchedule contentSchedule) {
        try {
            ContentSchedule updatedSchedule = contentScheduleService.updateSchedule(id, contentSchedule);
            return ResponseEntity.ok(updatedSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    // Update a content schedule from DTO (supports multiple time schedules)
    @PutMapping("/{id}/from-request")
    public ResponseEntity<?> updateContentScheduleFromRequest(@PathVariable("id") Long id, @RequestBody ContentScheduleRequest request) {
        try {
            ContentSchedule contentSchedule = contentScheduleService.convertFromRequest(request);
            ContentSchedule updatedSchedule = contentScheduleService.updateSchedule(id, contentSchedule);
            return ResponseEntity.ok(updatedSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    // Delete a content schedule
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContentSchedule(@PathVariable("id") Long id) {
        try {
            contentScheduleService.deleteSchedule(id);
            return ResponseEntity.ok("Content schedule deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    // Manual trigger to clean up expired content
    @PostMapping("/cleanup-expired")
    public ResponseEntity<?> cleanupExpiredContent() {
        try {
            contentScheduleService.restoreTemporarilyDisabledContent();
            return ResponseEntity.ok("Expired content cleaned up successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    // Get current content for a specific TV with image rotation support
    @GetMapping("/tv/{tvName}/current")
    public ResponseEntity<?> getCurrentContentForTV(@PathVariable("tvName") String tvName,
                                                    @RequestParam(value = "imageIndex", defaultValue = "0") int imageIndex) {
        try {
            TVEnum tv = TVEnum.valueOf(tvName);
            List<ContentSchedule> currentContent = contentScheduleService.getSchedulesForTV(tv);
            
            if (currentContent.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "No active content for this TV"));
            }
            
            ContentSchedule schedule = currentContent.get(0); // Get the highest priority content
            Map<String, Object> response = new HashMap<>();
            response.put("id", schedule.getId());
            response.put("title", schedule.getTitle());
            response.put("contentType", schedule.getContentType());
            response.put("content", schedule.getContent());
            response.put("isTimedContent", schedule.getStartTime() != null && schedule.getEndTime() != null);
            response.put("startTime", schedule.getStartTime());
            response.put("endTime", schedule.getEndTime());
            
            // Handle image rotation for image content types
            if (schedule.getContentType().toString().startsWith("IMAGE_") && 
                schedule.getImageUrls() != null && !schedule.getImageUrls().isEmpty()) {
                
                List<String> imageUrls = schedule.getImageUrls();
                int totalImages = imageUrls.size();
                
                // For different content types, determine how many images to show at once
                int imagesPerDisplay = switch (schedule.getContentType()) {
                    case IMAGE_SINGLE -> 1;
                    case IMAGE_DUAL -> 2;
                    case IMAGE_QUAD -> 4;
                    default -> 1;
                };
                
                // Calculate which images to show based on the current rotation index
                int startIndex = (imageIndex * imagesPerDisplay) % totalImages;
                List<String> currentImages = new java.util.ArrayList<>();
                
                for (int i = 0; i < imagesPerDisplay; i++) {
                    int currentImageIndex = (startIndex + i) % totalImages;
                    currentImages.add(imageUrls.get(currentImageIndex));
                }
                
                response.put("imageUrls", currentImages);
                response.put("totalImages", totalImages);
                response.put("currentRotationIndex", imageIndex);
                response.put("imagesPerDisplay", imagesPerDisplay);
                response.put("totalRotations", (int) Math.ceil((double) totalImages / imagesPerDisplay));
            } else {
                response.put("imageUrls", schedule.getImageUrls());
            }
            
            // Add video URLs if present
            if (schedule.getVideoUrls() != null && !schedule.getVideoUrls().isEmpty()) {
                response.put("videoUrls", schedule.getVideoUrls());
            }
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid TV name: " + tvName);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Get rotation information for content with multiple images
    @GetMapping("/tv/{tvName}/rotation-info")
    public ResponseEntity<?> getRotationInfo(@PathVariable("tvName") String tvName) {
        try {
            TVEnum tv = TVEnum.valueOf(tvName);
            List<ContentSchedule> currentContent = contentScheduleService.getSchedulesForTV(tv);
            
            if (currentContent.isEmpty()) {
                return ResponseEntity.ok(Map.of("hasRotation", false, "message", "No active content"));
            }
            
            ContentSchedule schedule = currentContent.get(0);
            Map<String, Object> rotationInfo = new HashMap<>();
            
            if (schedule.getContentType().toString().startsWith("IMAGE_") && 
                schedule.getImageUrls() != null && !schedule.getImageUrls().isEmpty()) {
                
                int imagesPerDisplay = switch (schedule.getContentType()) {
                    case IMAGE_SINGLE -> 1;
                    case IMAGE_DUAL -> 2;
                    case IMAGE_QUAD -> 4;
                    default -> 1;
                };
                
                int totalImages = schedule.getImageUrls().size();
                int totalRotations = (int) Math.ceil((double) totalImages / imagesPerDisplay);
                
                rotationInfo.put("hasRotation", totalRotations > 1);
                rotationInfo.put("totalImages", totalImages);
                rotationInfo.put("imagesPerDisplay", imagesPerDisplay);
                rotationInfo.put("totalRotations", totalRotations);
                rotationInfo.put("contentType", schedule.getContentType());
                rotationInfo.put("title", schedule.getTitle());
            } else {
                rotationInfo.put("hasRotation", false);
                rotationInfo.put("contentType", schedule.getContentType());
                rotationInfo.put("title", schedule.getTitle());
            }
            
            return ResponseEntity.ok(rotationInfo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid TV name: " + tvName);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Debug endpoint to check TV content status
    @GetMapping("/debug/tv/{tvName}")
    public ResponseEntity<?> debugTVContent(@PathVariable("tvName") String tvName) {
        try {
            TVEnum tv = TVEnum.valueOf(tvName);
            LocalDateTime now = LocalDateTime.now();
            
            // Get all schedules for this TV
            List<ContentSchedule> allSchedules = contentScheduleService.getAllSchedules().stream()
                .filter(s -> s.getTargetTVs().contains(tv))
                .toList();
            
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("currentTime", now);
            debugInfo.put("totalSchedulesForTV", allSchedules.size());
            debugInfo.put("activeSchedules", allSchedules.stream().filter(s -> s.isActive()).count());
            debugInfo.put("timedSchedules", allSchedules.stream()
                .filter(s -> s.isActive() && s.getStartTime() != null && s.getEndTime() != null)
                .count());
            debugInfo.put("immediateSchedules", allSchedules.stream()
                .filter(s -> s.isActive() && s.getStartTime() == null && s.getEndTime() == null)
                .count());
            
            // Check current content
            List<ContentSchedule> currentContent = contentScheduleService.getSchedulesForTV(tv);
            debugInfo.put("currentContentCount", currentContent.size());
            if (!currentContent.isEmpty()) {
                debugInfo.put("currentContentTitle", currentContent.get(0).getTitle());
                debugInfo.put("currentContentType", currentContent.get(0).getContentType());
            }
            
            // List all schedules with details
            List<Map<String, Object>> scheduleDetails = allSchedules.stream()
                .map(s -> {
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", s.getId());
                    details.put("title", s.getTitle());
                    details.put("active", s.isActive());
                    details.put("startTime", s.getStartTime());
                    details.put("endTime", s.getEndTime());
                    details.put("contentType", s.getContentType());
                    return details;
                })
                .toList();
            debugInfo.put("allSchedules", scheduleDetails);
            
            return ResponseEntity.ok(debugInfo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid TV name: " + tvName);
        }
    }
}
