package org.hyper.notificationbackend.services;

import org.hyper.notificationbackend.models.TVEnum;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class TVEnumService {
    
    // Get all TVs
    public List<TVEnum> getAllTVs() {
        return Arrays.asList(TVEnum.values());
    }

    
    // Get TV by its enum value
    public TVEnum getTV(TVEnum tv) {
        return tv;
    }
    
    // Get TV by name
    public Optional<TVEnum> getTVByName(String name) {
        return Arrays.stream(TVEnum.values())
                .filter(tv -> tv.name().equals(name) || tv.getDisplayName().equals(name))
                .findFirst();
    }

}
