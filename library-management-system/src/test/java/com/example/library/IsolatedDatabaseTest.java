package com.example.library;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/** Higher precedence than environment variables: tests never connect to a developer database. */
abstract class IsolatedDatabaseTest {
    @DynamicPropertySource
    static void isolatedDatabase(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", () -> "jdbc:tc:mysql:8.0:///library_test");
        properties.add("spring.datasource.username", () -> "test");
        properties.add("spring.datasource.password", () -> "test");
        properties.add("spring.datasource.driver-class-name", () -> "org.testcontainers.jdbc.ContainerDatabaseDriver");
        properties.add("app.scheduler.enabled", () -> "false");
        properties.add("app.bootstrap.enabled", () -> "false");
        properties.add("application.security.jwt.secret-key", () ->
                "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
    }
}
