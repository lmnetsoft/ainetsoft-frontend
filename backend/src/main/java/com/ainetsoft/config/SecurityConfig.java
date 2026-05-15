package com.ainetsoft.config;

import com.ainetsoft.service.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) 
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + authException.getMessage() + "\"}");
                })
            )
            
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // --- 1. PUBLIC ENDPOINTS ---
                .requestMatchers(
                    "/api/auth/login", 
                    "/api/auth/register", 
                    "/api/auth/verify-email",
                    "/api/auth/send-otp",
                    "/api/auth/verify-otp",
                    "/api/auth/forgot-password", 
                    "/api/auth/reset-password",
                    "/oauth2/**",
                    "/login/oauth2/**",
                    "/error",
                    "/api/uploads/**",
                    "/uploads/**",
                    "/api/chat/download/**",
                    "/api/chat/file/**",
                    "/ws/**",
                    "/api/report-reasons",
                    "/api/system-content/**",
                    "/api/help/tree",
                    "/api/footer-menus/**",
                    "/api/footer-icons/**",
                    "/api/vouchers/public/**",
                    "/api/orders/webhook/**",
                    "/api/shipping/webhook/**" // 🚀 BỔ SUNG ĐƯỜNG DẪN MỚI CHO GHN/GHTK WEBHOOK
                ).permitAll() 

                .requestMatchers("/api/chat/history/**").permitAll()
                .requestMatchers("/api/chat/read/**").permitAll()
                .requestMatchers("/api/chat/upload/**").permitAll() 
                
                .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reviews", "/api/reviews/**").permitAll()

                // --- 2. ADMIN ONLY ---
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/chat/admin/**").hasRole("ADMIN")
                
                .requestMatchers(HttpMethod.POST, "/api/footer-menus/**", "/api/help/nodes/**", "/api/footer-icons/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/footer-menus/**", "/api/help/nodes/**", "/api/footer-icons/**").hasRole("ADMIN")

                // --- 3. AUTHENTICATED USER ---
                .requestMatchers("/api/withdrawals/admin/**").hasRole("ADMIN")
                
                // 🚀 BỔ SUNG QUYỀN CHO NGƯỜI MUA: Cần đặt TRƯỚC rule của SELLER
                .requestMatchers("/api/withdrawals/user/**").authenticated() 
                
                .requestMatchers("/api/withdrawals/**").hasRole("SELLER")

                .requestMatchers(
                    "/api/auth/me", 
                    "/api/auth/profile", 
                    "/api/auth/sync-cart",
                    "/api/auth/change-password",
                    "/api/auth/upgrade-seller",
                    "/api/bank-accounts/**", 
                    "/api/orders/**",
                    "/api/notifications/**",
                    "/api/products/seller/**",
                    "/api/products/*/favorite",
                    "/api/products/*/report",
                    "/api/reviews/submit",
                    "/api/wallets/**",   
                    "/api/vouchers/seller/**" 
                ).authenticated() 
                
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.setContentType("application/json");
                    try {
                        response.getWriter().write("{\"message\": \"Logged out successfully\"}");
                    } catch (Exception e) {}
                })
            )
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(authorization -> authorization.baseUri("/oauth2/authorization"))
                .redirectionEndpoint(redirection -> redirection.baseUri("/login/oauth2/code/*"))
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .successHandler(oAuth2AuthenticationSuccessHandler)
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        
        config.setAllowedHeaders(List.of("*"));
        
        config.setExposedHeaders(List.of("Accept-Ranges", "Content-Encoding", "Content-Length", "Content-Range"));
        
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}