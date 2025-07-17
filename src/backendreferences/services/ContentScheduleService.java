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
            timeSchedule.setContentSchedule(contentSchedule);
            timeSchedules.add(timeSchedule);
            contentSchedule.setImmediate(false);
        }
        // No time schedules - immediate content
        else {
            contentSchedule.setImmediate(true);
        }
        
        contentSchedule.setTimeSchedules(timeSchedules);
        
        // Set active field from DTO
        contentSchedule.setActive(request.isActive());
        
        return contentSchedule;
    }
    
    // Create a new content schedule with multiple time schedules support
    public ContentSchedule createSchedule(ContentSchedule contentSchedule) {
        validateSchedule(contentSchedule);
        
        // Determine if this is immediate content
        boolean isImmediate = (contentSchedule.getTimeSchedules() == null || contentSchedule.getTimeSchedules().isEmpty());
        contentSchedule.setImmediate(isImmediate);
        
        // Handle content override logic
        handleContentOverride(contentSchedule);
        
        // Save the content schedule first
        ContentSchedule savedSchedule = contentScheduleRepository.save(contentSchedule);
        
        // Save time schedules if they exist
        if (!isImmediate) {
            for (TimeSchedule timeSchedule : contentSchedule.getTimeSchedules()) {
                timeSchedule.setContentSchedule(savedSchedule);
                timeScheduleRepository.save(timeSchedule);
            }
        }
        
        return savedSchedule;
    }
    
    // Create schedule from request DTO (new method)
    public ContentSchedule createScheduleFromRequest(ContentScheduleRequest request) {
        ContentSchedule contentSchedule = convertFromRequest(request);
        return createSchedule(contentSchedule);
    }
    
    // Get all content schedules
    public List<ContentSchedule> getAllSchedules() {
        return contentScheduleRepository.findAll();
    }
    
    // Get content schedule by ID
    public Optional<ContentSchedule> getScheduleById(Long id) {
        return contentScheduleRepository.findById(id);
    }
    
    // Get currently active schedules (includes both time-based and immediate schedules)
    public List<ContentSchedule> getCurrentlyActiveSchedules() {
        LocalDateTime now = LocalDateTime.now();
        List<ContentSchedule> activeSchedules = new ArrayList<>();
        
        // Get immediate schedules
        List<ContentSchedule> immediateSchedules = contentScheduleRepository.findImmediateSchedules();
        activeSchedules.addAll(immediateSchedules);
        
        // Get schedules with active time schedules
        List<TimeSchedule> activeTimeSchedules = timeScheduleRepository.findCurrentlyActive(now);
        for (TimeSchedule timeSchedule : activeTimeSchedules) {
            if (!activeSchedules.contains(timeSchedule.getContentSchedule())) {
                activeSchedules.add(timeSchedule.getContentSchedule());
            }
        }
        
        return activeSchedules;
    }
    
    // Get upcoming schedules
    public List<ContentSchedule> getUpcomingSchedules() {
        LocalDateTime now = LocalDateTime.now();
        List<ContentSchedule> upcomingSchedules = new ArrayList<>();
        
        List<TimeSchedule> upcomingTimeSchedules = timeScheduleRepository.findUpcoming(now);
        for (TimeSchedule timeSchedule : upcomingTimeSchedules) {
            if (!upcomingSchedules.contains(timeSchedule.getContentSchedule())) {
                upcomingSchedules.add(timeSchedule.getContentSchedule());
            }
        }
        
        return upcomingSchedules;
    }
    
    // Get immediate/indefinite schedules
    public List<ContentSchedule> getImmediateSchedules() {
        return contentScheduleRepository.findImmediateSchedules();
    }
    
    // Get schedules for a specific TV (prioritized by immediate vs scheduled)
    public List<ContentSchedule> getSchedulesForTV(TVEnum tv) {
        LocalDateTime now = LocalDateTime.now();
        List<ContentSchedule> result = new ArrayList<>();
        
        // First, get any scheduled content that's currently active (higher priority)
        List<TimeSchedule> activeTimeSchedules = timeScheduleRepository.findCurrentlyActiveForTV(tv, now);
        for (TimeSchedule timeSchedule : activeTimeSchedules) {
            ContentSchedule content = timeSchedule.getContentSchedule();
            if (content.isActive() && !result.contains(content)) {
                result.add(content);
            }
        }
        
        // If no scheduled content is active, get immediate content
        if (result.isEmpty()) {
            List<ContentSchedule> immediateSchedules = contentScheduleRepository.findImmediateForTV(tv);
            result.addAll(immediateSchedules.stream()
                .filter(ContentSchedule::isActive)
                .collect(Collectors.toList()));
        }
        
        return result;
    }
    
    // Get upcoming schedules for a specific TV
    public List<ContentSchedule> getUpcomingSchedulesForTV(TVEnum tv) {
        LocalDateTime now = LocalDateTime.now();
        List<ContentSchedule> upcomingSchedules = new ArrayList<>();
        
        List<TimeSchedule> upcomingTimeSchedules = timeScheduleRepository.findUpcomingForTV(tv, now);
        for (TimeSchedule timeSchedule : upcomingTimeSchedules) {
            if (!upcomingSchedules.contains(timeSchedule.getContentSchedule())) {
                upcomingSchedules.add(timeSchedule.getContentSchedule());
            }
        }
        
        return upcomingSchedules;
    }
    
    // Update a content schedule
    public ContentSchedule updateSchedule(Long id, ContentSchedule updatedSchedule) {
        Optional<ContentSchedule> existingScheduleOpt = contentScheduleRepository.findById(id);
        if (existingScheduleOpt.isPresent()) {
            validateSchedule(updatedSchedule);
            ContentSchedule existingSchedule = existingScheduleOpt.get();
            
            // Update fields
            existingSchedule.setTitle(updatedSchedule.getTitle());
            existingSchedule.setDescription(updatedSchedule.getDescription());
            existingSchedule.setContentType(updatedSchedule.getContentType());
            existingSchedule.setContent(updatedSchedule.getContent());
            existingSchedule.setImageUrls(updatedSchedule.getImageUrls());
            existingSchedule.setVideoUrls(updatedSchedule.getVideoUrls());
            existingSchedule.setActive(updatedSchedule.isActive());
            existingSchedule.setTargetTVs(updatedSchedule.getTargetTVs());
            
            // Handle time schedules updates
            if (updatedSchedule.getTimeSchedules() != null) {
                // Clear old time schedules properly
                existingSchedule.clearTimeSchedules();
                
                // Add new time schedules
                for (TimeSchedule timeSchedule : updatedSchedule.getTimeSchedules()) {
                    timeSchedule.setContentSchedule(existingSchedule);
                    existingSchedule.addTimeSchedule(timeSchedule);
                }
                existingSchedule.setImmediate(false);
            } else {
                // No time schedules provided - make it immediate content
                existingSchedule.clearTimeSchedules();
                existingSchedule.setImmediate(true);
            }
            
            return contentScheduleRepository.save(existingSchedule);
        }
        throw new RuntimeException("Content schedule not found with id: " + id);
    }
    
    // Delete a content schedule
    public void deleteSchedule(Long id) {
        contentScheduleRepository.deleteById(id);
    }
    
    // Handle content override logic for new schedules
    private void handleContentOverride(ContentSchedule newSchedule) {
        // For each target TV, handle existing content
        for (TVEnum tv : newSchedule.getTargetTVs()) {
            handleTVContentOverride(tv, newSchedule);
        }
    }
    
    // Handle content override for a specific TV
    private void handleTVContentOverride(TVEnum tv, ContentSchedule newSchedule) {
        // Get all active immediate content for this TV
        List<ContentSchedule> existingImmediate = contentScheduleRepository.findImmediateForTV(tv);
        
        for (ContentSchedule existing : existingImmediate) {
            if (existing.isActive()) {
                if (newSchedule.isImmediate()) {
                    // New immediate content overrides old immediate content permanently
                    existing.setActive(false);
                    contentScheduleRepository.save(existing);
                } else {
                    // New scheduled content temporarily overrides immediate content
                    // Store the disabled content IDs in each time schedule
                    for (TimeSchedule timeSchedule : newSchedule.getTimeSchedules()) {
                        String existingDisabled = timeSchedule.getTemporarilyDisabledContentIds();
                        if (existingDisabled != null && !existingDisabled.isEmpty()) {
                            timeSchedule.setTemporarilyDisabledContentIds(existingDisabled + "," + existing.getId());
                        } else {
                            timeSchedule.setTemporarilyDisabledContentIds(existing.getId().toString());
                        }
                    }
                    
                    existing.setActive(false);
                    contentScheduleRepository.save(existing);
                }
            }
        }
        
        // Handle overlapping scheduled content
        if (!newSchedule.isImmediate()) {
            for (TimeSchedule newTimeSchedule : newSchedule.getTimeSchedules()) {
                // Find any existing time schedules that overlap with this new one using the repository method
                List<TimeSchedule> overlappingSchedules = timeScheduleRepository.findOverlappingForTV(
                    tv, newTimeSchedule.getStartTime(), newTimeSchedule.getEndTime());
                
                for (TimeSchedule overlapping : overlappingSchedules) {
                    // Skip if it's the same schedule (in case of updates)
                    if (overlapping.getContentSchedule().getId().equals(newSchedule.getId())) {
                        continue;
                    }
                    
                    // Disable the overlapping time schedule
                    overlapping.setActive(false);
                    timeScheduleRepository.save(overlapping);
                    
                    // Store reference to restore later if needed
                    String existingDisabled = newTimeSchedule.getTemporarilyDisabledContentIds();
                    if (existingDisabled != null && !existingDisabled.isEmpty()) {
                        newTimeSchedule.setTemporarilyDisabledContentIds(existingDisabled + "," + overlapping.getContentSchedule().getId());
                    } else {
                        newTimeSchedule.setTemporarilyDisabledContentIds(overlapping.getContentSchedule().getId().toString());
                    }
                }
            }
        }
    }
    
    // Method to restore temporarily disabled content (called when timed content expires)
    @Scheduled(fixedRate = 60000) // Run every minute
    public void restoreTemporarilyDisabledContent() {
        LocalDateTime now = LocalDateTime.now();
        
        // Find all expired time schedules
        List<TimeSchedule> expiredSchedules = timeScheduleRepository.findExpired(now);
        
        for (TimeSchedule expiredSchedule : expiredSchedules) {
            // Restore any content that was temporarily disabled by this schedule
            if (expiredSchedule.getTemporarilyDisabledContentIds() != null && 
                !expiredSchedule.getTemporarilyDisabledContentIds().isEmpty()) {
                
                String[] disabledIds = expiredSchedule.getTemporarilyDisabledContentIds().split(",");
                for (String idStr : disabledIds) {
                    try {
                        Long disabledId = Long.parseLong(idStr.trim());
                        Optional<ContentSchedule> disabledContentOpt = contentScheduleRepository.findById(disabledId);
                        if (disabledContentOpt.isPresent()) {
                            ContentSchedule disabledContent = disabledContentOpt.get();
                            disabledContent.setActive(true);
                            contentScheduleRepository.save(disabledContent);
                        }
                    } catch (NumberFormatException e) {
                        // Log error but continue processing
                        System.err.println("Invalid content ID in temporarily disabled list: " + idStr);
                    }
                }
            }
            
            // Deactivate the expired time schedule
            expiredSchedule.setActive(false);
            timeScheduleRepository.save(expiredSchedule);
        }
        
        // Also deactivate any content schedules that only had timed content and all their time schedules are now expired
        List<ContentSchedule> allContentSchedules = contentScheduleRepository.findAll();
        for (ContentSchedule contentSchedule : allContentSchedules) {
            if (!contentSchedule.isImmediate() && contentSchedule.isActive()) {
                // Check if all time schedules for this content are expired or inactive
                boolean hasActiveTimeSchedule = contentSchedule.getTimeSchedules().stream()
                    .anyMatch(ts -> ts.isActive() && !ts.isExpired(now));
                
                if (!hasActiveTimeSchedule) {
                    // No active time schedules, deactivate the content schedule
                    contentSchedule.setActive(false);
                    contentScheduleRepository.save(contentSchedule);
                }
            }
        }
    }
    
    // Validate schedule data
    private void validateSchedule(ContentSchedule schedule) {
        // Validate time schedules
        if (schedule.getTimeSchedules() != null && !schedule.getTimeSchedules().isEmpty()) {
            for (TimeSchedule timeSchedule : schedule.getTimeSchedules()) {
                if (timeSchedule.getStartTime() == null || timeSchedule.getEndTime() == null) {
                    throw new IllegalArgumentException("Both start time and end time must be provided for scheduled content");
                }
                if (timeSchedule.getStartTime().isAfter(timeSchedule.getEndTime())) {
                    throw new IllegalArgumentException("Start time must be before end time for scheduled content");
                }
                // Check that the schedule is not in the past (optional)
                LocalDateTime now = LocalDateTime.now();
                if (timeSchedule.getEndTime().isBefore(now)) {
                    throw new IllegalArgumentException("Cannot schedule content in the past");
                }
            }
        }
        
        if (schedule.getContentType() == null) {
            throw new IllegalArgumentException("Content type must be provided");
        }
        
        // Validate content based on content type - allow multiple images for rotation
        if (schedule.getContentType() == ContentSchedule.ContentType.IMAGE_SINGLE && 
            (schedule.getImageUrls() == null || schedule.getImageUrls().size() < 1)) {
            throw new IllegalArgumentException("Single image content type requires at least one image URL");
        } else if (schedule.getContentType() == ContentSchedule.ContentType.IMAGE_DUAL && 
                  (schedule.getImageUrls() == null || schedule.getImageUrls().size() < 2)) {
            throw new IllegalArgumentException("Dual image content type requires at least two image URLs");
        } else if (schedule.getContentType() == ContentSchedule.ContentType.IMAGE_QUAD && 
                  (schedule.getImageUrls() == null || schedule.getImageUrls().size() < 4)) {
            throw new IllegalArgumentException("Quad image content type requires at least four image URLs");
        } else if (schedule.getContentType() == ContentSchedule.ContentType.VIDEO && 
                  (schedule.getVideoUrls() == null || schedule.getVideoUrls().size() != 1)) {
            throw new IllegalArgumentException("Video content type requires exactly one video URL");
        } else if (schedule.getContentType() == ContentSchedule.ContentType.EMBED && 
                  (schedule.getContent() == null || schedule.getContent().isEmpty())) {
            throw new IllegalArgumentException("Embed content type requires embed content");
        } else if (schedule.getContentType() == ContentSchedule.ContentType.TEXT &&
                  (schedule.getContent() == null || schedule.getContent().isEmpty())) {
            throw new IllegalArgumentException("Text content type requires text content");
        }
        
        if (schedule.getTargetTVs() == null || schedule.getTargetTVs().isEmpty()) {
            throw new IllegalArgumentException("At least one target TV must be specified");
        }
    }
}
