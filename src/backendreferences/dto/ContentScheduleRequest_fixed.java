package org.hyper.notificationbackend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public class ContentScheduleRequest {
    private String title;
    private String description;
    private String contentType; // Will be converted to enum
    private String content;
    private List<String> imageUrls;
    private List<String> videoUrls;
    private Set<String> targetTVs; // Will be converted to TVEnum set
    
    // Add active field to support frontend requirements
    private boolean active = true;
    
    // Multiple time schedules support
    private List<TimeScheduleRequest> timeSchedules;
    
    // Legacy single schedule support (for backward compatibility)
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    // Nested class for time schedule requests
    public static class TimeScheduleRequest {
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        
        public TimeScheduleRequest() {}
        
        public TimeScheduleRequest(LocalDateTime startTime, LocalDateTime endTime) {
            this.startTime = startTime;
            this.endTime = endTime;
        }
        
        // Getters and Setters
        public LocalDateTime getStartTime() {
            return startTime;
        }
        
        public void setStartTime(LocalDateTime startTime) {
            this.startTime = startTime;
        }
        
        public LocalDateTime getEndTime() {
            return endTime;
        }
        
        public void setEndTime(LocalDateTime endTime) {
            this.endTime = endTime;
        }
        
        @Override
        public String toString() {
            return "TimeScheduleRequest{" +
                    "startTime=" + startTime +
                    ", endTime=" + endTime +
                    '}';
        }
    }
    
    // Constructors
    public ContentScheduleRequest() {}
    
    // Getters and Setters
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getContentType() {
        return contentType;
    }
    
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public List<String> getImageUrls() {
        return imageUrls;
    }
    
    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }
    
    public List<String> getVideoUrls() {
        return videoUrls;
    }
    
    public void setVideoUrls(List<String> videoUrls) {
        this.videoUrls = videoUrls;
    }
    
    public Set<String> getTargetTVs() {
        return targetTVs;
    }
    
    public void setTargetTVs(Set<String> targetTVs) {
        this.targetTVs = targetTVs;
    }
    
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
    
    public List<TimeScheduleRequest> getTimeSchedules() {
        return timeSchedules;
    }
    
    public void setTimeSchedules(List<TimeScheduleRequest> timeSchedules) {
        this.timeSchedules = timeSchedules;
    }
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    @Override
    public String toString() {
        return "ContentScheduleRequest{" +
                "title='" + title + '\'' +
                ", contentType='" + contentType + '\'' +
                ", targetTVs=" + targetTVs +
                ", active=" + active +
                ", timeSchedules=" + timeSchedules +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                '}';
    }
}
