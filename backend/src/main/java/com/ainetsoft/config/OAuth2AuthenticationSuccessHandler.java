package com.ainetsoft.config;

import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor // Added to inject JwtUtils and UserRepository
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtils jwtUtils; // Added
    private final UserRepository userRepository; // Added

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, 
                                        Authentication authentication) throws IOException, ServletException {
        
        // Extract the user identity from the OAuth2 authentication
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        // Fetch user from DB to get their roles (populated by CustomOAuth2UserService)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found after OAuth2 login"));

        // Generate the JWT token
        String token = jwtUtils.generateToken(user.getEmail(), user.getRoles());

        // Target: The frontend route handling the post-login sync
        String targetUrl = "http://localhost:5173/oauth2/redirect";
        
        // Append the JWT token to the URL so the frontend can catch and save it
        String finalUrl = UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("token", token) // The actual JWT token
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