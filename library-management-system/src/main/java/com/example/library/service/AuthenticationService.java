package com.example.library.service;

import com.example.library.dto.AuthenticationRequest;
import com.example.library.dto.AuthenticationResponse;
import com.example.library.dto.RegisterRequest;
import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.model.Role;
import com.example.library.model.User;
import com.example.library.repository.UserRepository;
import com.example.library.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {
        Optional<User> existingUserOpt = repository.findAnyByEmail(request.getEmail());
        
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (existingUser.isActive()) {
                throw new ResourceAlreadyExistsException("Email is already in use");
            } else {
                existingUser.setFirstName(request.getFirstName());
                existingUser.setLastName(request.getLastName());
                existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
                existingUser.setRole(request.getRole() == null ? Role.USER : request.getRole());
                existingUser.setMembershipDate(request.getMembershipDate() == null ? LocalDate.now() : request.getMembershipDate());
                existingUser.setActive(true);
                repository.save(existingUser);
                
                var jwtToken = jwtService.generateToken(existingUser);
                return AuthenticationResponse.builder()
                        .token(jwtToken)
                        .role(existingUser.getRole().name())
                        .build();
            }
        }

        var user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() == null ? Role.USER : request.getRole())
                .membershipDate(request.getMembershipDate() == null ? LocalDate.now() : request.getMembershipDate())
                .active(true)
                .build();
                
        repository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .role(user.getRole().name())
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User account not found or deactivated"));
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .role(user.getRole().name())
                .build();
    }
}