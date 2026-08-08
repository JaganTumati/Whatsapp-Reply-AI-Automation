package com.restaurant.ai.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * PLACEHOLDER ONLY. This exists so the app is runnable and testable during
 * Phase 2-4 (menu CRUD, mock-mode AI loop) without every request bouncing
 * off Spring Security's default login form.
 *
 * This is NOT the production security posture. Phase 19 replaces this with:
 *  - JWT authentication filter
 *  - role-based method security (@PreAuthorize) per Phase 19/25 role matrix
 *  - the WhatsApp webhook endpoint secured by Meta signature verification
 *    instead of JWT (see integration.WhatsAppWebhookController, Phase 9)
 *
 * Do not deploy this configuration to production.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
