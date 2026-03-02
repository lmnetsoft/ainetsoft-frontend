package com.ainetsoft.service;

import com.ainetsoft.dto.UpdateProfileRequest;
import com.ainetsoft.model.User;
import com.ainetsoft.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testUpdateProfile_Success() {
        // Arrange
        String contact = "test@example.com";
        User existingUser = new User();
        existingUser.setEmail(contact);
        existingUser.setFullName("Old Name");

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("New Name");
        request.setEmail("test@example.com"); // No change in email

        when(userRepository.findByIdentifier(contact)).thenReturn(Optional.of(existingUser));

        // Act
        String result = authService.updateProfile(contact, request);

        // Assert
        assertEquals("Cập nhật hồ sơ thành công!", result);
        assertEquals("New Name", existingUser.getFullName());
        verify(userRepository, times(1)).save(existingUser);
    }

    @Test
    void testUpdateProfile_DuplicateEmail_ThrowsException() {
        // Arrange
        String contact = "user1@example.com";
        String takenEmail = "taken@example.com";

        User user1 = new User();
        user1.setEmail(contact);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("User One");
        request.setEmail(takenEmail);

        when(userRepository.findByIdentifier(contact)).thenReturn(Optional.of(user1));
        // Mock that the NEW email is already in use by someone else
        when(userRepository.existsByEmail(takenEmail)).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.updateProfile(contact, request);
        });

        assertTrue(exception.getMessage().contains("đã được sử dụng"));
        verify(userRepository, never()).save(any());
    }
}