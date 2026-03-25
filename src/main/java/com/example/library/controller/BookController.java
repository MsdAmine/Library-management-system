package com.example.library.controller;


import com.example.library.dto.BookResponseDTO;
import com.example.library.model.Book;
import com.example.library.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<List<BookResponseDTO>> getAllBooks() {
        // We map the list of Entities to a list of DTOs
        List<BookResponseDTO> books = bookService.getAllBooks()
                .stream()
                .map(this::convertToDTO)
                .toList();
        return ResponseEntity.ok(books);
    }

    @PostMapping
    public ResponseEntity<BookResponseDTO> addBook(@Valid @RequestBody Book book) {
        // 1. Call the service (The service handles the ISBN check)
        Book savedBook = bookService.addBook(book);

        // 2. Convert the saved Entity to a DTO for the response
        return new ResponseEntity<>(convertToDTO(savedBook), HttpStatus.CREATED);
    }

    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<BookResponseDTO> getBookByIsbn(@PathVariable String isbn) {
        return bookService.getBookByIsbn(isbn)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    // In a real job, we'd use a tool like MapStruct, but learn the manual way first!
    private BookResponseDTO convertToDTO(Book book) {
        BookResponseDTO dto = new BookResponseDTO();
        dto.setTitle(book.getTitle());
        dto.setAuthor(book.getAuthor());
        dto.setIsbn(book.getIsbn());
        dto.setAvailableCopies(book.getAvailableCopies());
        return dto;
    }
}