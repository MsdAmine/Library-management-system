package com.example.library.service;

import com.example.library.dto.BookRequestDTO;
import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.model.Book;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BookSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    public Page<Book> getAllBooks(Pageable pageable) {
        return bookRepository.findAllActive(pageable);
    }

    public Optional<Book> getBookById(Long id) {
        return bookRepository.findActiveById(id);
    }

    public Optional<Book> getBookByIsbn(String isbn) {
        return bookRepository.findByIsbn(isbn);
    }

    public Page<Book> searchBooks(String title, String author, String genre, Boolean available, Pageable pageable) {
        Specification<Book> spec = Specification.where(BookSpecification.isActive())
                .and(BookSpecification.hasTitle(title))
                .and(BookSpecification.hasAuthor(author))
                .and(BookSpecification.hasGenre(genre))
                .and(BookSpecification.isAvailable(available));
        return bookRepository.findAll(spec, pageable);
    }

    @Transactional
    public Book addBook(BookRequestDTO requestDTO) {
        String isbn = requestDTO.getIsbn() != null ? requestDTO.getIsbn().trim() : null;
        Optional<Book> existingBookOpt = isbn != null ? bookRepository.findAnyByIsbn(isbn) : Optional.empty();
        
        int total = requestDTO.getTotalCopies() != null ? requestDTO.getTotalCopies() : 0;
        int available = requestDTO.getAvailableCopies() != null ? requestDTO.getAvailableCopies() : total;
        if (available > total) {
            available = total;
        }

        if (existingBookOpt.isPresent()) {
            Book existingBook = existingBookOpt.get();
            if (existingBook.isActive()) {
                throw new ResourceAlreadyExistsException("A book with ISBN " + isbn + " already exists.");
            } else {
                existingBook.setTitle(requestDTO.getTitle().trim());
                existingBook.setAuthor(requestDTO.getAuthor().trim());
                existingBook.setGenre(requestDTO.getGenre());
                existingBook.setPublicationYear(requestDTO.getPublicationYear());
                existingBook.setTotalCopies(total);
                existingBook.setAvailableCopies(available);
                existingBook.setActive(true);
                return bookRepository.save(existingBook);
            }
        }

        Book book = new Book();
        book.setTitle(requestDTO.getTitle().trim());
        book.setAuthor(requestDTO.getAuthor().trim());
        book.setIsbn(isbn);
        book.setGenre(requestDTO.getGenre());
        book.setPublicationYear(requestDTO.getPublicationYear());
        book.setTotalCopies(total);
        book.setAvailableCopies(available);
        book.setActive(true);

        return bookRepository.save(book);
    }

    @Transactional
    public Book addBook(Book book) {
        BookRequestDTO dto = BookRequestDTO.builder()
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .genre(book.getGenre())
                .publicationYear(book.getPublicationYear())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .build();
        return addBook(dto);
    }

    @Transactional
    public void deleteBook(Long id) {
        Book book = bookRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id " + id));
        book.setActive(false);
        bookRepository.save(book);
    }

    @Transactional
    public Book updateBook(Long id, BookRequestDTO requestDTO) {
        return bookRepository.findActiveById(id)
                .map(book -> {
                    String newIsbn = requestDTO.getIsbn() != null ? requestDTO.getIsbn().trim() : null;
                    if (newIsbn != null && !newIsbn.equals(book.getIsbn())) {
                        bookRepository.findAnyByIsbn(newIsbn).ifPresent(other -> {
                            if (!other.getId().equals(id) && other.isActive()) {
                                throw new ResourceAlreadyExistsException("A book with ISBN " + newIsbn + " already exists.");
                            }
                        });
                        book.setIsbn(newIsbn);
                    }

                    int total = requestDTO.getTotalCopies() != null ? requestDTO.getTotalCopies() : book.getTotalCopies();
                    int available = requestDTO.getAvailableCopies() != null ? requestDTO.getAvailableCopies() : book.getAvailableCopies();
                    if (available > total) {
                        available = total;
                    }

                    book.setTitle(requestDTO.getTitle().trim());
                    book.setAuthor(requestDTO.getAuthor().trim());
                    book.setGenre(requestDTO.getGenre());
                    book.setPublicationYear(requestDTO.getPublicationYear());
                    book.setTotalCopies(total);
                    book.setAvailableCopies(available);
                    return bookRepository.save(book);
                }).orElseThrow(() -> new ResourceNotFoundException("Book not found with id " + id));
    }

    @Transactional
    public Book updateBook(Long id, Book bookDetails) {
        BookRequestDTO dto = BookRequestDTO.builder()
                .title(bookDetails.getTitle())
                .author(bookDetails.getAuthor())
                .isbn(bookDetails.getIsbn())
                .genre(bookDetails.getGenre())
                .publicationYear(bookDetails.getPublicationYear())
                .totalCopies(bookDetails.getTotalCopies())
                .availableCopies(bookDetails.getAvailableCopies())
                .build();
        return updateBook(id, dto);
    }
}