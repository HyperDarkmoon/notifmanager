package org.hyper.notificationbackend.models;

/**
 * Enum representing the fixed set of TVs in the system.
 */
public enum TVEnum {
    TV1("TV 1"),
    TV2("TV 2"),
    TV3("TV 3"),
    TV4("TV 4");
    
    private final String displayName;

    
    TVEnum(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
