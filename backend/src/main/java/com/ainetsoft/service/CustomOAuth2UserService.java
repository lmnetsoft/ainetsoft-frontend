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
import java.util.Collections;
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

        // FIX: Tell Spring to use "email" as the Principal Name instead of the ID number
        return new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_USER"),
                oAuth2User.getAttributes(),
                "email" 
        );
    }

    private void processOAuth2User(String registrationId, String providerId, OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture"); 
        
        if (registrationId.equalsIgnoreCase("facebook")) {
            Map<String, Object> pictureObj = oAuth2User.getAttribute("picture");
            if (pictureObj != null) {
                Map<String, Object> data = (Map<String, Object>) pictureObj.get("data");
                if (data != null) {
                    picture = (String) data.get("url");
                }
            }
        }

        final String finalPicture = picture;
        
        userRepository.findByEmail(email).ifPresentOrElse(
            existingUser -> {
                existingUser.setFullName(name);
                existingUser.setAvatarUrl(finalPicture);
                existingUser.setUpdatedAt(LocalDateTime.now());
                userRepository.save(existingUser);
            },
            () -> {
                User newUser = User.builder()
                        .email(email)
                        .fullName(name)
                        .avatarUrl(finalPicture)
                        .provider(User.AuthProvider.valueOf(registrationId.toUpperCase()))
                        .providerId(providerId)
                        .roles(Set.of("USER"))
                        .enabled(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                userRepository.save(newUser);
            }
        );
    }
}