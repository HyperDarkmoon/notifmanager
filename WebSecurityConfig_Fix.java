// Updated WebSecurityConfig.java - Apply this to your backend
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(authz -> authz
            .requestMatchers("/api/auth/**").permitAll()
            // TV content viewing endpoints - only need authentication, not admin role
            .requestMatchers("/api/content/tv/**").authenticated()
            // Content management endpoints - require admin role
            .requestMatchers(HttpMethod.GET, "/api/content/all").hasRole("ADMIN")
            .requestMatchers(HttpMethod.GET, "/api/content/active").hasRole("ADMIN")
            .requestMatchers(HttpMethod.GET, "/api/content/upcoming").hasRole("ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/content").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PUT, "/api/content/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/content/**").hasRole("ADMIN")
            .requestMatchers("/api/content/**").hasRole("ADMIN")
            // Other admin endpoints
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/tv/**").authenticated()
            .anyRequest().authenticated()
        )
        .httpBasic();

    http.authenticationProvider(authenticationProvider());

    return http.build();
}

/* 
IMPORTANT: The order of requestMatchers matters in Spring Security!
More specific patterns must come BEFORE more general patterns.

Current issue: 
- /api/content/** (requires ADMIN) comes before /api/content/tv/** (should be authenticated only)
- This means /api/content/tv/TV1 matches /api/content/** first and requires ADMIN role

Fixed order:
1. /api/content/tv/** (authenticated only) - most specific
2. /api/content/** (admin only) - less specific
*/
