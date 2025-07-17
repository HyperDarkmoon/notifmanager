package org.hyper.notificationbackend.controllers;

import org.hyper.notificationbackend.models.TVEnum;
import org.hyper.notificationbackend.services.TVEnumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tv")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TVController {

    @Autowired
    private TVEnumService tvEnumService;
    
    // Get all TVs
    @GetMapping("/all")
    public ResponseEntity<List<TVEnum>> getAllTVs() {
        return ResponseEntity.ok(tvEnumService.getAllTVs());
    }
    
    // Get TV by name
    @GetMapping("/{name}")
    public ResponseEntity<?> getTVByName(@PathVariable String name) {
        Optional<TVEnum> tv = tvEnumService.getTVByName(name);
        return tv.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
  
}
