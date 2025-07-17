package org.hyper.notificationbackend.repositories;

import org.hyper.notificationbackend.models.TimeSchedule;
import org.hyper.notificationbackend.models.TVEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TimeScheduleRepository extends JpaRepository<TimeSchedule, Long> {
    
    // Find currently active time schedules
    @Query("SELECT ts FROM TimeSchedule ts WHERE ts.active = true AND ts.startTime <= :currentTime AND ts.endTime >= :currentTime")
    List<TimeSchedule> findCurrentlyActive(@Param("currentTime") LocalDateTime currentTime);
    
    // Find upcoming time schedules
    @Query("SELECT ts FROM TimeSchedule ts WHERE ts.active = true AND ts.startTime > :currentTime ORDER BY ts.startTime ASC")
    List<TimeSchedule> findUpcoming(@Param("currentTime") LocalDateTime currentTime);
    
    // Find expired time schedules
    @Query("SELECT ts FROM TimeSchedule ts WHERE ts.active = true AND ts.endTime < :currentTime")
    List<TimeSchedule> findExpired(@Param("currentTime") LocalDateTime currentTime);
    
    // Find currently active time schedules for a specific TV
    @Query("SELECT ts FROM TimeSchedule ts JOIN ts.contentSchedule cs JOIN cs.targetTVs tv " +
           "WHERE tv = :tv AND ts.active = true AND cs.active = true AND " +
           "ts.startTime <= :currentTime AND ts.endTime >= :currentTime " +
           "ORDER BY ts.startTime ASC")
    List<TimeSchedule> findCurrentlyActiveForTV(@Param("tv") TVEnum tv, @Param("currentTime") LocalDateTime currentTime);
    
    // Find upcoming time schedules for a specific TV
    @Query("SELECT ts FROM TimeSchedule ts JOIN ts.contentSchedule cs JOIN cs.targetTVs tv " +
           "WHERE tv = :tv AND ts.active = true AND cs.active = true AND " +
           "ts.startTime > :currentTime " +
           "ORDER BY ts.startTime ASC")
    List<TimeSchedule> findUpcomingForTV(@Param("tv") TVEnum tv, @Param("currentTime") LocalDateTime currentTime);
    
    // Find all time schedules for a specific TV (active or inactive)
    @Query("SELECT ts FROM TimeSchedule ts JOIN ts.contentSchedule cs JOIN cs.targetTVs tv " +
           "WHERE tv = :tv ORDER BY ts.startTime ASC")
    List<TimeSchedule> findByTV(@Param("tv") TVEnum tv);
    
    // Find time schedules by content schedule ID
    @Query("SELECT ts FROM TimeSchedule ts WHERE ts.contentSchedule.id = :contentScheduleId ORDER BY ts.startTime ASC")
    List<TimeSchedule> findByContentScheduleId(@Param("contentScheduleId") Long contentScheduleId);
    
    // Find overlapping time schedules for a specific TV within a time range
    @Query("SELECT ts FROM TimeSchedule ts JOIN ts.contentSchedule cs JOIN cs.targetTVs tv " +
           "WHERE tv = :tv AND ts.active = true AND cs.active = true AND " +
           "((ts.startTime < :endTime AND ts.endTime > :startTime)) " +
           "ORDER BY ts.startTime ASC")
    List<TimeSchedule> findOverlappingForTV(@Param("tv") TVEnum tv, 
                                           @Param("startTime") LocalDateTime startTime, 
                                           @Param("endTime") LocalDateTime endTime);
    
    // Delete all time schedules for a content schedule
    @Query("DELETE FROM TimeSchedule ts WHERE ts.contentSchedule.id = :contentScheduleId")
    void deleteByContentScheduleId(@Param("contentScheduleId") Long contentScheduleId);
}
