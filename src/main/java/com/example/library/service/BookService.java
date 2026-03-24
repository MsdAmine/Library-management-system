package com.example.library.service;

import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.model.Book;
import com.example.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    // THIS IS THE METHOD YOUR CONTROLLER IS MISSING
    public Optional<Book> getBookByIsbn(String isbn) {
        return bookRepository.findByIsbn(isbn);
    }

    public Book addBook(Book book) {
        // 1. Business Rule: Specific Exception for duplicate data
        if (bookRepository.findByIsbn(book.getIsbn()).isPresent()) {
            throw new ResourceAlreadyExistsException("A book with ISBN " + book.getIsbn() + " already exists.");
        }

        // 2. Business Rule: Logical Data Correction
        if (book.getAvailableCopies() > book.getTotalCopies()) {
            book.setAvailableCopies(book.getTotalCopies());
        }

        return bookRepository.save(book);
    }
}