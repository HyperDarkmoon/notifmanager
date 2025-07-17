package org.hyper.notificationbackend.services;

import org.hyper.notificationbackend.models.ContentSchedule;
import org.hyper.notificationbackend.models.TimeSchedule;
import org.hyper.notificationbackend.models.TVEnum;
import org.hyper.notificationbackend.repositories.ContentScheduleRepository;
import org.hyper.notificationbackend.repositories.TimeScheduleRepository;
import org.hyper.notificationbackend.dto.ContentScheduleRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ContentScheduleService {
    
    @Autowired
    private ContentScheduleRepository contentScheduleRepository;
    
    @Autowired
    private TimeScheduleRepository timeScheduleRepository;
    
    // Convert DTO to entity with multiple time schedules support
    public ContentSchedule convertFromRequest(ContentScheduleRequest request) {
        ContentSchedule contentSchedule = new ContentSchedule();
        
        contentSchedule.setTitle(request.getTitle());
        contentSchedule.setDescription(request.getDescription());
        contentSchedule.setContent(request.getContent());
        contentSchedule.setImageUrls(request.getImageUrls());
        contentSchedule.setVideoUrls(request.getVideoUrls());
        
        // Convert content type string to enum
        if (request.getContentType() != null) {
            contentSchedule.setContentType(ContentSchedule.ContentType.valueOf(request.getContentType()));
        }
        
        // Convert target TVs
        if (request.getTargetTVs() != null) {
            Set<TVEnum> targetTVs = request.getTargetTVs().stream()
                .map(TVEnum::valueOf)
                .collect(Collectors.toSet());
            contentSchedule.setTargetTVs(targetTVs);
        }
        
        // Handle time schedules - support both new format and legacy format
        List<TimeSchedule> timeSchedules = new ArrayList<>();
        
        // First, check if we have new format time schedules (multiple schedules)
        if (request.getTimeSchedules() != null && !request.getTimeSchedules().isEmpty()) {
            for (ContentScheduleRequest.TimeScheduleRequest tsRequest : request.getTimeSchedules()) {
                TimeSchedule timeSchedule = new TimeSchedule();
                timeSchedule.setStartTime(tsRequest.getStartTime());
                timeSchedule.setEndTime(tsRequest.getEndTime());
                // Set the relationship - this is crucial!
                timeSchedule.setContentSchedule(contentSchedule);
                timeSchedules.add(timeSchedule);
            }
            contentSchedule.setImmediate(false);
        } 
        // Check legacy format (single start/end time)
        else if (request.getStartTime() != null && request.getEndTime() != null) {
            TimeSchedule timeSchedule = new TimeSchedule();
            timeSchedule.setStartTime(request.getStartTime());
            timeSchedule.setEndTime(request.getEndTime());
            // Set the relationship - this is crucial!
            timeSchedule.setContentSchedule(contentSchedule);
            timeSchedules.add(timeSchedule);
            contentSchedule.setImmediate(false);
        }
        // No time schedules - immediate content
        else {
            contentSchedule.setImmediate(true);
        }
        
        contentSchedule.setTimeSchedules(timeSchedules);
        
        // Set active to true by default (since DTO doesn't include this field)
        contentSchedule.setActive(true);
        
        return contentSchedule;
    }
    
    // Create a new content schedule with multiple time schedules support
    @Transactional
    public ContentSchedule createSchedule(ContentSchedule contentSchedule) {
        validateSchedule(contentSchedule);
        
        // Determine if this is immediate content
        boolean isImmediate = (contentSchedule.getTimeSchedules() == null || contentSchedule.getTimeSchedules().isEmpty());
        contentSchedule.setImmediate(isImmediate);
        
        // Handle content override logic
        handleContentOverride(contentSchedule);
        
        // FIXED: Properly set up bidirectional relationship before saving
        if (!isImmediate && contentSchedule.getTimeSchedules() != null) {
            for (TimeSchedule timeSchedule : contentSchedule.getTimeSchedules()) {
                timeSchedule.setContentSchedule(contentSchedule);
            }
        }
        
        // Save the content schedule with cascaded time schedules
        // The cascade should handle saving the time schedules automatically
        ContentSchedule savedSchedule = contentScheduleRepository.save(contentSchedule);
        
        return savedSchedule;
    }
    
    // Create schedule from request DTO (new method)
    @Transactional
    public ContentSchedule createScheduleFromRequest(ContentScheduleRequest request) {
        ContentSchedule contentSchedule = convertFromRequest(request);
        return createSchedule(contentSchedule);
    }
    
    // ... rest of the methods remain the same ...
    
    // Validation method
    private void validateSchedule(ContentSchedule contentSchedule) {
        if (contentSchedule.getTitle() == null || contentSchedule.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }
        
        if (contentSchedule.getTargetTVs() == null || contentSchedule.getTargetTVs().isEmpty()) {
            throw new IllegalArgumentException("At least one target TV is required");
        }
        
        if (contentSchedule.getContentType() == null) {
            throw new IllegalArgumentException("Content type is required");
        }
        
        // Validate time schedules if they exist
        if (contentSchedule.getTimeSchedules() != null) {
            for (TimeSchedule timeSchedule : contentSchedule.getTimeSchedules()) {
                if (timeSchedule.getStartTime() == null || timeSchedule.getEndTime() == null) {
                    throw new IllegalArgumentException("Time schedule start and end times are required");
                }
                
                if (timeSchedule.getStartTime().isAfter(timeSchedule.getEndTime()) || 
                    timeSchedule.getStartTime().equals(timeSchedule.getEndTime())) {
                    throw new IllegalArgumentException("Time schedule start time must be before end time");
                }
            }
        }
    }
    
    // Content override logic
    private void handleContentOverride(ContentSchedule contentSchedule) {
        // Implementation for handling content override logic
        // This method should handle the logic for temporarily disabling content
        // when scheduled content overrides immediate content
    }
}
