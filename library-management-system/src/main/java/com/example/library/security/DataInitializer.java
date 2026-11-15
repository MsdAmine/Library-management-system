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

@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "app.bootstrap.enabled", havingValue = "true")
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.bootstrap.email}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${app.bootstrap.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        seedAdminUser();
    }

    private void seedAdminUser() {
        userRepository.findByEmail(adminEmail).ifPresentOrElse(
                admin -> log.info("Admin account already exists: {}", adminEmail),
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
                    log.info("Admin account created: {}", adminEmail);
                }
        );
    }
}
