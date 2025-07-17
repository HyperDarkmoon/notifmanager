package org.hyper.notificationbackend.repositories;

import org.hyper.notificationbackend.models.ContentSchedule;
import org.hyper.notificationbackend.models.TVEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ContentScheduleRepository extends JpaRepository<ContentSchedule, Long> {
    // Find schedules that are currently active (deprecated - use TimeScheduleRepository instead)
    @Deprecated
    @Query("SELECT c FROM ContentSchedule c WHERE c.active = true AND c.startTime <= ?1 AND c.endTime >= ?1")
    List<ContentSchedule> findCurrentlyActive(LocalDateTime currentTime);
    
    // Find upcoming schedules (deprecated - use TimeScheduleRepository instead)
    @Deprecated
    @Query("SELECT c FROM ContentSchedule c WHERE c.active = true AND c.startTime > ?1 ORDER BY c.startTime ASC")
    List<ContentSchedule> findUpcoming(LocalDateTime currentTime);
    
    // Find immediate/indefinite schedules (no time schedules, show immediately and indefinitely)
    @Query("SELECT c FROM ContentSchedule c WHERE c.active = true AND c.immediate = true")
    List<ContentSchedule> findImmediateSchedules();

    // Find schedules for a specific TV (includes immediate schedules)
    @Query("SELECT c FROM ContentSchedule c JOIN c.targetTVs t WHERE t = ?1 AND c.active = true")
    List<ContentSchedule> findByTV(TVEnum tv);
    
    // Find immediate schedules for a specific TV
    @Query("SELECT c FROM ContentSchedule c JOIN c.targetTVs t WHERE t = ?1 AND c.active = true AND c.immediate = true")
    List<ContentSchedule> findImmediateForTV(TVEnum tv);
    
    // Find upcoming schedules for a specific TV (deprecated - use TimeScheduleRepository instead)
    @Deprecated
    @Query("SELECT c FROM ContentSchedule c JOIN c.targetTVs t WHERE t = ?1 AND c.active = true AND c.startTime > ?2 ORDER BY c.startTime ASC")
    List<ContentSchedule> findUpcomingForTV(TVEnum tv, LocalDateTime currentTime);
    
    // Find the highest priority active content for a specific TV at current time (deprecated - use service layer logic instead)
    @Deprecated
    @Query("SELECT c FROM ContentSchedule c JOIN c.targetTVs t WHERE t = ?1 AND c.active = true AND " +
           "((c.startTime IS NULL AND c.endTime IS NULL) OR " +
           "(c.startTime <= ?2 AND c.endTime >= ?2)) " +
           "ORDER BY " +
           "CASE WHEN c.startTime IS NOT NULL AND c.endTime IS NOT NULL THEN 1 " +
           "     WHEN c.startTime IS NULL AND c.endTime IS NULL THEN 2 " +
           "     ELSE 3 END ASC, " +
           "c.startTime ASC")
    List<ContentSchedule> findActiveContentForTVPrioritized(TVEnum tv, LocalDateTime currentTime);
}
