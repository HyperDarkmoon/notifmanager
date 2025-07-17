package org.hyper.notificationbackend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "time_schedules")
public class TimeSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;
    
    @Column(name = "active")
    private boolean active = true;
    
    // Store IDs of content that was temporarily disabled by this schedule
    @Column(name = "temporarily_disabled_content_ids", columnDefinition = "TEXT")
    private String temporarilyDisabledContentIds;
    
    // Many-to-one relationship with ContentSchedule
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_schedule_id", nullable = false)
    private ContentSchedule contentSchedule;
    
    // Constructors
    public TimeSchedule() {}
    
    public TimeSchedule(LocalDateTime startTime, LocalDateTime endTime) {
        this.startTime = startTime;
        this.endTime = endTime;
    }
    
    // Helper methods
    public boolean isCurrentlyActive(LocalDateTime currentTime) {
        return active && currentTime.isAfter(startTime) && currentTime.isBefore(endTime);
    }
    
    public boolean isExpired(LocalDateTime currentTime) {
        return currentTime.isAfter(endTime);
    }
    
    public boolean isUpcoming(LocalDateTime currentTime) {
        return currentTime.isBefore(startTime);
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
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
    
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
    
    public String getTemporarilyDisabledContentIds() {
        return temporarilyDisabledContentIds;
    }
    
    public void setTemporarilyDisabledContentIds(String temporarilyDisabledContentIds) {
        this.temporarilyDisabledContentIds = temporarilyDisabledContentIds;
    }
    
    public ContentSchedule getContentSchedule() {
        return contentSchedule;
    }
    
    public void setContentSchedule(ContentSchedule contentSchedule) {
        this.contentSchedule = contentSchedule;
    }
    
    @Override
    public String toString() {
        return "TimeSchedule{" +
                "id=" + id +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", active=" + active +
                '}';
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TimeSchedule)) return false;
        TimeSchedule that = (TimeSchedule) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
