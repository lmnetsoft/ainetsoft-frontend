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
    private final AzureCommunicationService azureService;

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
            throw new OAuth2AuthenticationException(new OAuth2Error("server_error"), ex.getMessage());
        }
    }

    private void processOAuth2User(String registrationId, String providerId, OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        
        if (!StringUtils.hasText(email)) {
            log.error("Email not found from {} provider", registrationId);
            throw new RuntimeException("Email không được cung cấp từ phía " + registrationId);
        }

        String nameFromSocial = oAuth2User.getAttribute("name");
        
        // --- Picture Extraction Logic ---
        Object pictureAttr = oAuth2User.getAttribute("picture");
        String pictureFromSocial = null;

        if (registrationId.equalsIgnoreCase("facebook") && pictureAttr instanceof Map) {
            try {
                Map<String, Object> data = (Map<String, Object>) ((Map<String, Object>) pictureAttr).get("data");
                if (data != null) pictureFromSocial = (String) data.get("url");
            } catch (Exception e) {
                log.warn("Failed to parse Facebook profile picture");
            }
        } else {
            pictureFromSocial = (pictureAttr instanceof String) ? (String) pictureAttr : null;
        }

        final String finalSocialPicture = pictureFromSocial;
        
        // --- 🚀 OPTION 2: ACCOUNT LINKING ---
        userRepository.findByEmail(email).ifPresentOrElse(
            existingUser -> {
                log.info("Merging existing user {} with social provider {}", email, registrationId);

                // Use latest profile info from social media
                existingUser.setFullName(nameFromSocial);
                existingUser.setAvatarUrl(finalSocialPicture);

                // 🛡️ Auto-verify and clean tokens
                existingUser.setEnabled(true);
                existingUser.setEmailVerified(true);
                existingUser.setVerificationToken(null);
                existingUser.setVerificationTokenExpiry(null); // Now compiles!

                try {
                    existingUser.setProvider(User.AuthProvider.valueOf(registrationId.toUpperCase()));
                } catch (Exception e) {
                    existingUser.setProvider(User.AuthProvider.GOOGLE); 
                }
                
                existingUser.setProviderId(providerId);
                existingUser.setUpdatedAt(LocalDateTime.now());
                userRepository.save(existingUser);

                // Send security notification alert
                try {
                    azureService.sendSecurityAlertEmail(
                        email, 
                        "Liên kết tài khoản mạng xã hội", 
                        "Tài khoản của bạn vừa được liên kết thành công với " + registrationId.toUpperCase() + "."
                    );
                } catch (Exception e) {
                    log.error("Security notification failed: {}", e.getMessage());
                }
            },
            () -> {
                // Logic for brand new Social User
                User newUser = User.builder()
                        .email(email)
                        .fullName(nameFromSocial)
                        .avatarUrl(finalSocialPicture)
                        .provider(User.AuthProvider.valueOf(registrationId.toUpperCase()))
                        .providerId(providerId)
                        .roles(new java.util.HashSet<>(Set.of("USER"))) 
                        .enabled(true)
                        .emailVerified(true) 
                        .cart(new java.util.ArrayList<>())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                userRepository.save(newUser);
            }
        );
    }
}