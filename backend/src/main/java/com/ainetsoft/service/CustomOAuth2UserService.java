package com.ainetsoft.service;

import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        
        try {
            String registrationId = oAuth2UserRequest.getClientRegistration().getRegistrationId();
            String userNameAttributeName = oAuth2UserRequest.getClientRegistration()
                    .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();
            String providerId = oAuth2User.getAttribute(userNameAttributeName);

            processOAuth2User(registrationId, providerId, oAuth2User);

            return new DefaultOAuth2User(
                    oAuth2User.getAuthorities(),
                    oAuth2User.getAttributes(),
                    "email" 
            );
        } catch (Exception ex) {
            log.error("OAuth2 Authentication Error: {}", ex.getMessage());
            // Throwing a proper OAuth2 error prevents a 500 Internal Server Error
            throw new OAuth2AuthenticationException(new OAuth2Error("server_error"), ex.getMessage());
        }
    }

    private void processOAuth2User(String registrationId, String providerId, OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        
        // CRITICAL FIX: If email is null, we cannot find or create a user.
        if (!StringUtils.hasText(email)) {
            log.error("Email not found from {} provider", registrationId);
            throw new RuntimeException("Email không được cung cấp từ phía " + registrationId);
        }

        String nameFromSocial = oAuth2User.getAttribute("name");
        
        // SAFE EXTRACTION: picture handling preserved and hardened
        Object pictureAttr = oAuth2User.getAttribute("picture");
        String pictureFromSocial = null;

        if (registrationId.equalsIgnoreCase("facebook")) {
            if (pictureAttr instanceof Map) {
                try {
                    Map<String, Object> pictureObj = (Map<String, Object>) pictureAttr;
                    Map<String, Object> data = (Map<String, Object>) pictureObj.get("data");
                    if (data != null) {
                        pictureFromSocial = (String) data.get("url");
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse Facebook profile picture");
                }
            }
        } else {
            pictureFromSocial = (pictureAttr instanceof String) ? (String) pictureAttr : null;
        }

        final String finalSocialPicture = pictureFromSocial;
        
        userRepository.findByEmail(email).ifPresentOrElse(
            existingUser -> {
                // Update display info if current is blank
                if (!StringUtils.hasText(existingUser.getFullName())) {
                    existingUser.setFullName(nameFromSocial);
                }
                
                if (!StringUtils.hasText(existingUser.getAvatarUrl())) {
                    existingUser.setAvatarUrl(finalSocialPicture);
                }

                // Force update provider to the one currently being used
                try {
                    existingUser.setProvider(User.AuthProvider.valueOf(registrationId.toUpperCase()));
                } catch (Exception e) {
                    existingUser.setProvider(User.AuthProvider.GOOGLE); // Default fallback
                }
                
                existingUser.setProviderId(providerId);
                existingUser.setUpdatedAt(LocalDateTime.now());
                userRepository.save(existingUser);
            },
            () -> {
                // New user creation logic preserved
                User newUser = User.builder()
                        .email(email)
                        .fullName(nameFromSocial)
                        .avatarUrl(finalSocialPicture)
                        .provider(User.AuthProvider.valueOf(registrationId.toUpperCase()))
                        .providerId(providerId)
                        .roles(new java.util.HashSet<>(Set.of("ROLE_USER", "USER"))) // Added both formats for stability
                        .enabled(true)
                        .cart(new java.util.ArrayList<>())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                userRepository.save(newUser);
            }
        );
    }
}