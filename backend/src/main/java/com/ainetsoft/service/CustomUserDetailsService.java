package com.ainetsoft.service;

import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String contactInfo) throws UsernameNotFoundException {
        // Handle normalization consistently (100% ORIGINAL)
        String identifier = normalizeIdentifier(contactInfo);
        
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + contactInfo));

        // 🚀 PHASE 5 SUPREME LOCKDOWN ENFORCEMENT
        // If the account is disabled (enabled = false), stop the login.
        if (!user.isEnabled()) {
            throw new DisabledException("Tài khoản này đã bị vô hiệu hóa.");
        }

        // If the status is BANNED, stop the login and throw Locked error.
        if ("BANNED".equalsIgnoreCase(user.getAccountStatus())) {
            throw new LockedException("Tài khoản của bạn đã bị khóa bởi Quản trị viên.");
        }

        // FIX 1: Roles safety check (100% ORIGINAL)
        Set<String> roles = user.getRoles();
        if (roles == null || roles.isEmpty()) {
            log.warn("User {} has no roles in DB. Assigning default USER role.", identifier);
            roles = Collections.singleton("USER");
        }

        // FIX 2: Spring Security password placeholder (100% ORIGINAL)
        String password = (user.getPassword() != null) ? user.getPassword() : "OAUTH2_USER";

        return new org.springframework.security.core.userdetails.User(
                identifier,
                password,
                roles.stream()
                        .map(role -> {
                            // FIX 3: Authority mapping (100% ORIGINAL)
                            String finalRole = role.toUpperCase().startsWith("ROLE_") ? role.toUpperCase() : "ROLE_" + role.toUpperCase();
                            return new SimpleGrantedAuthority(finalRole);
                        })
                        .collect(Collectors.toList())
        );
    }

    private String normalizeIdentifier(String identifier) {
        if (identifier == null) return null;
        String trimmed = identifier.trim();
        if (trimmed.contains("@")) {
            return trimmed.toLowerCase();
        }
        return trimmed.replaceAll("[^0-9]", "");
    }
}