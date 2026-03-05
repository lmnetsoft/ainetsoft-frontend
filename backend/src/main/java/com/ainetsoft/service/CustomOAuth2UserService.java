package com.ainetsoft.service;

import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        
        String registrationId = oAuth2UserRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = oAuth2UserRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();
        String providerId = oAuth2User.getAttribute(userNameAttributeName);

        processOAuth2User(registrationId, providerId, oAuth2User);

        // FIX: Consistently use "email" as the Principal name for session management
        return new DefaultOAuth2User(
                oAuth2User.getAuthorities(),
                oAuth2User.getAttributes(),
                "email" 
        );
    }

    private void processOAuth2User(String registrationId, String providerId, OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String nameFromSocial = oAuth2User.getAttribute("name");
        
        // SAFE EXTRACTION: picture can be a String (Google) or a Map (Facebook)
        Object pictureAttr = oAuth2User.getAttribute("picture");
        String pictureFromSocial = null;

        if (registrationId.equalsIgnoreCase("facebook")) {
            // Facebook nesting: picture -> data -> url
            if (pictureAttr instanceof Map) {
                Map<String, Object> pictureObj = (Map<String, Object>) pictureAttr;
                Map<String, Object> data = (Map<String, Object>) pictureObj.get("data");
                if (data != null) {
                    pictureFromSocial = (String) data.get("url");
                }
            }
        } else {
            // Default for Google and others where it is a direct String
            pictureFromSocial = (pictureAttr instanceof String) ? (String) pictureAttr : null;
        }

        final String finalSocialPicture = pictureFromSocial;
        
        userRepository.findByEmail(email).ifPresentOrElse(
            existingUser -> {
                // LOGIC: Only update display info if the current data is NULL or BLANK.
                if (existingUser.getFullName() == null || existingUser.getFullName().isBlank()) {
                    existingUser.setFullName(nameFromSocial);
                }
                
                if (existingUser.getAvatarUrl() == null || existingUser.getAvatarUrl().isBlank()) {
                    existingUser.setAvatarUrl(finalSocialPicture);
                }

                // FIXED: Force update provider and providerId to current login method.
                // This prevents the user from being "stuck" with the Google provider identity in the UI.
                existingUser.setProvider(User.AuthProvider.valueOf(registrationId.toUpperCase()));
                existingUser.setProviderId(providerId);

                existingUser.setUpdatedAt(LocalDateTime.now());
                userRepository.save(existingUser);
            },
            () -> {
                // Create new account if email doesn't exist
                User newUser = User.builder()
                        .email(email)
                        .fullName(nameFromSocial)
                        .avatarUrl(finalSocialPicture)
                        .provider(User.AuthProvider.valueOf(registrationId.toUpperCase()))
                        .providerId(providerId)
                        .roles(new java.util.HashSet<>(Set.of("USER")))
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