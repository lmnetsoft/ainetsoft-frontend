package com.ainetsoft.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, 
                                        Authentication authentication) throws IOException, ServletException {
        
        // FOR TESTING: Redirect to the API directly to see the user JSON
        // String targetUrl = "http://localhost:8080/api/auth/me";
        String targetUrl = "http://localhost:5173/oauth2/redirect";
        
        if (response.isCommitted()) return;

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}