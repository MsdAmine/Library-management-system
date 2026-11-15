package com.example.library.security;

import com.example.library.model.User;
import com.example.library.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

class DataInitializerTest {
    @Test void startupNeverResetsExistingAdministrator() {
        UserRepository users = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        User existing = User.builder().password("existing-password-hash").build();
        when(users.findByEmail("admin@test.local")).thenReturn(Optional.of(existing));
        DataInitializer initializer = new DataInitializer(users, encoder);
        ReflectionTestUtils.setField(initializer, "adminEmail", "admin@test.local");
        ReflectionTestUtils.setField(initializer, "adminPassword", "new-bootstrap-password");
        initializer.run(); initializer.run();
        assertThat(existing.getPassword()).isEqualTo("existing-password-hash");
        verify(users, never()).save(any());
        verifyNoInteractions(encoder);
    }
}
