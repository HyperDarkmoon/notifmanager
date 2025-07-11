# Security Configuration Fix

The issue is in your Spring Security configuration. The TV content fetching endpoints need different permissions:

## Current Configuration (causing 403):
```java
.requestMatchers("/api/tv/**").authenticated()
.requestMatchers("/api/content/**").hasRole("ADMIN")
```

## Fixed Configuration:
```java
.requestMatchers("/api/auth/**").permitAll()
.requestMatchers("/api/content/tv/**").authenticated()  // TV content viewing - just authenticated
.requestMatchers("/api/content/**").hasRole("ADMIN")   // Content management - admin only
.requestMatchers("/api/tv/**").authenticated()
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```

## Update your WebSecurityConfig.java:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(authz -> authz
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/content/tv/**").authenticated()  // NEW: TV content viewing
            .requestMatchers("/api/content/**").hasRole("ADMIN")    // Content management
            .requestMatchers("/api/tv/**").authenticated()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        )
        .httpBasic();

    http.authenticationProvider(authenticationProvider());

    return http.build();
}
```

This way:
- `/api/content/tv/TV1` - accessible to authenticated users (TVs can view)
- `/api/content` (POST/PUT/DELETE) - accessible only to admins (content management)
