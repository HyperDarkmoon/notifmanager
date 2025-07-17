package org.hyper.notificationbackend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ContentCleanupService {
    
    @Autowired
    private ContentScheduleService contentScheduleService;
    
    // Run every minute to check for expired content and restore disabled content
    @Scheduled(fixedRate = 60000) // 60 seconds
    public void cleanupExpiredContent() {
        contentScheduleService.restoreTemporarilyDisabledContent();
    }
}
