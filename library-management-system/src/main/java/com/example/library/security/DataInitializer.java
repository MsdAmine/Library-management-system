package com.example.library.security;

import com.example.library.model.Role;
import com.example.library.model.User;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdminUser();
    }

    private void seedAdminUser() {
        String adminEmail = "admin@library.com";
        String adminPassword = "admin123";

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
                admin -> {
                    admin.setPassword(passwordEncoder.encode(adminPassword));
                    admin.setRole(Role.ADMIN);
                    admin.setActive(true);
                    userRepository.save(admin);
                    log.info("Admin account updated: {} / {}", adminEmail, adminPassword);
                },
                () -> {
                    User admin = User.builder()
                            .firstName("System")
                            .lastName("Admin")
                            .email(adminEmail)
                            .password(passwordEncoder.encode(adminPassword))
                            .role(Role.ADMIN)
                            .membershipDate(LocalDate.now())
                            .active(true)
                            .build();
                    userRepository.save(admin);
                    log.info("Admin account created: {} / {}", adminEmail, adminPassword);
                }
        );
    }
}
