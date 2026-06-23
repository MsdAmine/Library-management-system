package com.example.library.service;

import com.example.library.dto.MemberRequestDTO;
import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.model.Role;
import com.example.library.model.User;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final UserRepository userRepository;

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

    public User addMember(MemberRequestDTO memberDetails) {
        if (userRepository.findByEmail(memberDetails.getEmail()).isPresent()) {
            throw new ResourceAlreadyExistsException("A member with email " + memberDetails.getEmail() + " already exists.");
        }
        User user = User.builder()
            .firstName(memberDetails.getFirstName())
            .lastName(memberDetails.getLastName())
            .email(memberDetails.getEmail())
            .password(memberDetails.getPassword())
            .membershipDate(memberDetails.getMembershipDate())
            .role(Role.USER)
            .active(true)
            .build();
        return userRepository.save(user);
    }

    public void deleteMember(Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setActive(false);
            userRepository.save(user);
        });
    }

    public User updateMember(Long id, MemberRequestDTO memberDetails) {
        return userRepository.findActiveById(id)
                .map(user -> {
                    user.setFirstName(memberDetails.getFirstName());
                    user.setLastName(memberDetails.getLastName());
                    user.setEmail(memberDetails.getEmail());
                    if (memberDetails.getPassword() != null && !memberDetails.getPassword().isEmpty()) {
                        user.setPassword(memberDetails.getPassword());
                    }
                    if (memberDetails.getMembershipDate() != null) {
                        user.setMembershipDate(memberDetails.getMembershipDate());
                    }
                    return userRepository.save(user);
                }).orElseThrow(() -> new RuntimeException("Member not found with id " + id));
    }
}
