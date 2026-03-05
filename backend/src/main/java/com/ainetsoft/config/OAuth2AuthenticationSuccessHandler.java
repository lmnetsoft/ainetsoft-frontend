package com.ainetsoft.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, 
                                        Authentication authentication) throws IOException, ServletException {
        
        // Target: The frontend route handling the post-login sync
        String targetUrl = "http://localhost:5173/oauth2/redirect";
        
        // Append query param to trigger clean local state update on frontend
        String finalUrl = UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("auth", "success")
                .build().toUriString();

        if (response.isCommitted()) {
            logger.debug("Response already committed. Skipping redirect to " + finalUrl);
            return;
        }

        // Redirect browser back to React frontend
        getRedirectStrategy().sendRedirect(request, response, finalUrl);
    }
}