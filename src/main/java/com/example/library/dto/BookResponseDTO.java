package com.example.library.dto;

import lombok.Data;

@Data
public class BookResponseDTO {
    private String title;
    private String author;
    private String isbn;
    private int availableCopies;
}