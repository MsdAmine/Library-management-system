package com.example.library.service;

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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<User> getAllMembers(Pageable pageable) {
        return userRepository.findAllActive(pageable);
    }

    public Optional<User> getMemberById(Long id) {
        return userRepository.findActiveById(id);
    }

    public Optional<User> getMemberByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Page<User> searchMembersByName(String name, Pageable pageable) {
        return userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(name, name, pageable);
    }

    @Transactional
    public User addMember(User user) {
        Optional<User> existingUserOpt = userRepository.findAnyByEmail(user.getEmail());
        
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (existingUser.isActive()) {
                throw new ResourceAlreadyExistsException("A user with email " + user.getEmail() + " already exists.");
            } else {
                existingUser.setFirstName(user.getFirstName());
                existingUser.setLastName(user.getLastName());
                existingUser.setMembershipDate(user.getMembershipDate() == null ? LocalDate.now() : user.getMembershipDate());
                if (user.getPassword() != null) {
                    existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
                }
                existingUser.setRole(user.getRole() == null ? Role.USER : user.getRole());
                existingUser.setActive(true);
                return userRepository.save(existingUser);
            }
        }
        
        // Provide a baseline default fallback password if added manually without one
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode("ChangeMe123!"));
        } else {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        
        if (user.getRole() == null) {
            user.setRole(Role.USER); // Library member map standard
        }
        
        return userRepository.save(user);
    }

    @Transactional
    public void deleteMember(Long id) {
        userRepository.findActiveById(id).ifPresent(user -> {
            user.setActive(false);
            userRepository.save(user);
        });
    }

    @Transactional
    public User updateMember(Long id, User memberDetails) {
        return userRepository.findActiveById(id)
                .map(user -> {
                    user.setFirstName(memberDetails.getFirstName());
                    user.setLastName(memberDetails.getLastName());
                    user.setEmail(memberDetails.getEmail());
                    if (memberDetails.getMembershipDate() != null) {
                        user.setMembershipDate(memberDetails.getMembershipDate());
                    }
                    return userRepository.save(user);
                }).orElseThrow(() -> new ResourceNotFoundException("Member not found with id " + id));
    }
}