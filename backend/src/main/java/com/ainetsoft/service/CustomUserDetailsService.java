package com.ainetsoft.service;

import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String contactInfo) throws UsernameNotFoundException {
        // We use the same normalization logic as your AuthService to handle email or phone
        String identifier = normalizeIdentifier(contactInfo);
        
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + contactInfo));

        return new org.springframework.security.core.userdetails.User(
                identifier,
                user.getPassword(),
                user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
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