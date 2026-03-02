package com.ainetsoft.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new DelegatingSecurityContextRepository(
                new RequestAttributeSecurityContextRepository(),
                new HttpSessionSecurityContextRepository()
        );
    }

    /**
     * Required to manually set authentication in the Controller's login method.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) 
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // Ensure the session-based security context is preserved across requests
            .securityContext(context -> context.securityContextRepository(securityContextRepository()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(auth -> auth
                // Allow pre-flight OPTIONS requests for CORS
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // PUBLIC ACCESS
                .requestMatchers(
                    "/api/auth/login", 
                    "/api/auth/register", 
                    "/api/auth/forgot-password", 
                    "/api/auth/reset-password"
                ).permitAll() 
                
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll() 
                
                // PROTECTED: Requires valid session cookie (JSESSIONID)
                .requestMatchers(
                    "/api/auth/me", 
                    "/api/auth/profile", 
                    "/api/auth/sync-cart",
                    "/api/auth/change-password",
                    "/api/auth/upgrade-seller",
                    "/api/orders/**"
                ).authenticated() 
                
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173")); 
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Fixed: Allow all headers to prevent CORS blocks on custom frontend headers
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); 
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}