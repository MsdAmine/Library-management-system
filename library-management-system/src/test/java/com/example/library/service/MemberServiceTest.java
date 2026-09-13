package com.example.library.service;

import com.example.library.dto.MemberRequestDTO;
import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.model.Role;
import com.example.library.model.User;
import com.example.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private MemberService memberService;

    private MemberRequestDTO sampleRequest;

    @BeforeEach
    void setUp() {
        sampleRequest = new MemberRequestDTO();
        sampleRequest.setFirstName("Alice");
        sampleRequest.setLastName("Smith");
        sampleRequest.setEmail("alice.smith@example.com");
        sampleRequest.setMembershipDate(LocalDate.of(2026, 1, 15));
    }

    @Test
    @DisplayName("addMember: Encodes provided password and saves active user with Role.USER")
    void addMember_WithExplicitPassword_EncodesAndSaves() {
        sampleRequest.setPassword("CustomSecret123!");
        when(userRepository.findByEmail("alice.smith@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("CustomSecret123!")).thenReturn("hashed_CustomSecret123!");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User createdUser = memberService.addMember(sampleRequest);

        assertThat(createdUser).isNotNull();
        assertThat(createdUser.getFirstName()).isEqualTo("Alice");
        assertThat(createdUser.getLastName()).isEqualTo("Smith");
        assertThat(createdUser.getEmail()).isEqualTo("alice.smith@example.com");
        assertThat(createdUser.getPassword()).isEqualTo("hashed_CustomSecret123!");
        assertThat(createdUser.getRole()).isEqualTo(Role.USER);
        assertThat(createdUser.isActive()).isTrue();
        assertThat(createdUser.getMembershipDate()).isEqualTo(LocalDate.of(2026, 1, 15));

        verify(passwordEncoder).encode("CustomSecret123!");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("addMember: When password is blank or null, assigns default password Library2026!")
    void addMember_WithoutPassword_UsesDefaultPassword() {
        sampleRequest.setPassword(null);
        when(userRepository.findByEmail("alice.smith@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(MemberService.DEFAULT_MEMBER_PASSWORD)).thenReturn("hashed_Library2026!");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User createdUser = memberService.addMember(sampleRequest);

        assertThat(createdUser).isNotNull();
        assertThat(createdUser.getPassword()).isEqualTo("hashed_Library2026!");
        assertThat(createdUser.getRole()).isEqualTo(Role.USER);
        assertThat(createdUser.isActive()).isTrue();

        verify(passwordEncoder).encode("Library2026!");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("addMember: Throws ResourceAlreadyExistsException when active user exists")
    void addMember_WhenActiveUserExists_ThrowsConflict() {
        User existing = User.builder()
                .id(10L)
                .email("alice.smith@example.com")
                .active(true)
                .build();
        when(userRepository.findByEmail("alice.smith@example.com")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> memberService.addMember(sampleRequest))
                .isInstanceOf(ResourceAlreadyExistsException.class)
                .hasMessageContaining("already exists");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("addMember: Reactivates and updates soft-deleted user account")
    void addMember_WhenInactiveUserExists_ReactivatesAccount() {
        User inactiveUser = User.builder()
                .id(20L)
                .firstName("Old")
                .lastName("Name")
                .email("alice.smith@example.com")
                .active(false)
                .build();
        when(userRepository.findByEmail("alice.smith@example.com")).thenReturn(Optional.of(inactiveUser));
        when(passwordEncoder.encode(anyString())).thenReturn("new_hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = memberService.addMember(sampleRequest);

        assertThat(result.isActive()).isTrue();
        assertThat(result.getFirstName()).isEqualTo("Alice");
        assertThat(result.getLastName()).isEqualTo("Smith");
        assertThat(result.getRole()).isEqualTo(Role.USER);
        verify(userRepository).save(inactiveUser);
    }

    @Test
    @DisplayName("updateMember: Updates profile details and hashes new password if provided")
    void updateMember_WithNewPassword_UpdatesAndHashes() {
        User existing = User.builder()
                .id(5L)
                .firstName("Alice")
                .lastName("Smith")
                .email("alice.smith@example.com")
                .password("old_hash")
                .active(true)
                .build();
        when(userRepository.findActiveById(5L)).thenReturn(Optional.of(existing));
        when(passwordEncoder.encode("NewPassword2026!")).thenReturn("hashed_NewPassword2026!");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        sampleRequest.setFirstName("Alice Updated");
        sampleRequest.setPassword("NewPassword2026!");

        User updated = memberService.updateMember(5L, sampleRequest);

        assertThat(updated.getFirstName()).isEqualTo("Alice Updated");
        assertThat(updated.getPassword()).isEqualTo("hashed_NewPassword2026!");
        verify(passwordEncoder).encode("NewPassword2026!");
    }

    @Test
    @DisplayName("deleteMember: Soft-deletes user by setting active to false")
    void deleteMember_SetsActiveFalse() {
        User existing = User.builder()
                .id(7L)
                .active(true)
                .build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(existing));

        memberService.deleteMember(7L);

        assertThat(existing.isActive()).isFalse();
        verify(userRepository).save(existing);
    }
}
