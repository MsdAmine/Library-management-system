package com.example.library.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookRequestDTO {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Author is required")
    private String author;

    @Pattern(
        regexp = "^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$",
        message = "Please provide a valid ISBN format"
    )
    private String isbn;

    @Min(value = 1000, message = "Publication year must be at least 1000")
    @Max(value = 2026, message = "Publication year cannot be in the future")
    private int publicationYear;

    private String genre;

    @NotNull(message = "Total copies is required")
    @PositiveOrZero(message = "Total copies must be zero or positive")
    private Integer totalCopies;

    @NotNull(message = "Available copies is required")
    @PositiveOrZero(message = "Available copies must be zero or positive")
    private Integer availableCopies;
}
