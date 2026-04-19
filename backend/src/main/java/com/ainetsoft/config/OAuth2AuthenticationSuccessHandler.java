package com.ainetsoft.config;

import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value; // 🚀 Added for dynamic URL
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    /**
     * 🚀 PRODUCTION READY: Dynamic Frontend URL.
     * This ensures the redirect works on both localhost and your Azure deployment.
     */
    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, 
                                        Authentication authentication) throws IOException, ServletException {
        
        // 1. Extract the social user identity
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        // 2. Fetch the linked user from DB
        // At this point, the account is already enabled/linked by CustomOAuth2UserService.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found after social login sync"));

        // 3. Generate a fresh JWT for the existing account
        String token = jwtUtils.generateToken(user.getEmail(), user.getRoles());

        // 4. Build the target URL using the configuration property
        String targetUrl = frontendUrl + "/oauth2/redirect";
        
        // 5. Append the JWT so the React frontend can store it
        String finalUrl = UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("token", token)
                .queryParam("auth", "success")
                .build().toUriString();

        if (response.isCommitted()) {
            logger.debug("Response already committed. Skipping redirect to " + finalUrl);
            return;
        }

        // 6. Send the user back to the application
        getRedirectStrategy().sendRedirect(request, response, finalUrl);
    }
}