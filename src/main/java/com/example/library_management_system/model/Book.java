package com.example.library_management_system.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Author is required")
    private String author;

    @Column(unique = true)
    @Pattern(regexp = "^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$")
    private String isbn;

    @Min(1000)
    @Max(2026)
    private int publicationYear;

    private String genre;

    @PositiveOrZero
    private int totalCopies;

    @PositiveOrZero
    private int availableCopies;

    // --- CHALLENGE FIELDS ---

    @Column(updatable = false) // Once set at creation, this should never change
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // --- LIFECYCLE HOOKS ---

    @PrePersist // Runs automatically right before the INSERT SQL is sent to MySQL
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate // Runs automatically right before the UPDATE SQL is sent to MySQL
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}