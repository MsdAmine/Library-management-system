package com.example.library.service;

import com.example.library.dto.MemberRequestDTO;
import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.model.Role;
import com.example.library.model.User;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {

    public static final String DEFAULT_MEMBER_PASSWORD = "Library2026!";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<User> getAllMembers(Pageable pageable) {
        return userRepository.findAllActive(pageable);
    }

    public Optional<User> getMemberById(Long id) {
        return userRepository.findActiveById(id);
    }

    public Optional<User> getMemberByEmail(String email) {
        return userRepository.findActiveByEmail(email);
    }

    public Page<User> searchMembersByName(String name, Pageable pageable) {
        return userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseAndActiveTrue(name, name, pageable);
    }

    @Transactional
    public User addMember(MemberRequestDTO memberDetails) {
        String email = memberDetails.getEmail() != null ? memberDetails.getEmail().trim() : "";
        Optional<User> existingUserOpt = userRepository.findByEmail(email);

        String rawPassword = (memberDetails.getPassword() != null && !memberDetails.getPassword().trim().isEmpty())
                ? memberDetails.getPassword().trim()
                : DEFAULT_MEMBER_PASSWORD;
        String encodedPassword = passwordEncoder.encode(rawPassword);

        LocalDate membershipDate = memberDetails.getMembershipDate() != null 
                ? memberDetails.getMembershipDate() 
                : LocalDate.now();

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (existingUser.isActive()) {
                throw new ResourceAlreadyExistsException("A member with email " + email + " already exists.");
            } else {
                // Reactivate previously soft-deleted member account with updated profile
                existingUser.setFirstName(memberDetails.getFirstName().trim());
                existingUser.setLastName(memberDetails.getLastName().trim());
                existingUser.setPassword(encodedPassword);
                existingUser.setRole(Role.USER);
                existingUser.setMembershipDate(membershipDate);
                existingUser.setActive(true);
                return userRepository.save(existingUser);
            }
        }

        User user = User.builder()
                .firstName(memberDetails.getFirstName().trim())
                .lastName(memberDetails.getLastName().trim())
                .email(email)
                .password(encodedPassword)
                .membershipDate(membershipDate)
                .role(Role.USER)
                .active(true)
                .build();
        return userRepository.save(user);
    }

    @Transactional
    public User createMember(MemberRequestDTO memberDetails) {
        return addMember(memberDetails);
    }

    @Transactional
    public User registerMember(MemberRequestDTO memberDetails) {
        return addMember(memberDetails);
    }

    @Transactional
    public void deleteMember(Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setActive(false);
            userRepository.save(user);
        });
    }

    @Transactional
    public User updateMember(Long id, MemberRequestDTO memberDetails) {
        return userRepository.findActiveById(id)
                .map(user -> {
                    String newEmail = memberDetails.getEmail() != null ? memberDetails.getEmail().trim() : "";
                    if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                        userRepository.findByEmail(newEmail).ifPresent(otherUser -> {
                            if (!otherUser.getId().equals(id)) {
                                throw new ResourceAlreadyExistsException("A member with email " + newEmail + " already exists.");
                            }
                        });
                        user.setEmail(newEmail);
                    }
                    user.setFirstName(memberDetails.getFirstName().trim());
                    user.setLastName(memberDetails.getLastName().trim());
                    if (memberDetails.getPassword() != null && !memberDetails.getPassword().trim().isEmpty()) {
                        user.setPassword(passwordEncoder.encode(memberDetails.getPassword().trim()));
                    }
                    if (memberDetails.getMembershipDate() != null) {
                        user.setMembershipDate(memberDetails.getMembershipDate());
                    }
                    return userRepository.save(user);
                }).orElseThrow(() -> new ResourceNotFoundException("Member not found with id " + id));
    }
}
