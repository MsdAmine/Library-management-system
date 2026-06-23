package com.example.library.service;

import com.example.library.exception.ResourceAlreadyExistsException;
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
    public Book addBook(Book book) {
        Optional<Book> existingBookOpt = bookRepository.findAnyByIsbn(book.getIsbn());
        
        if (existingBookOpt.isPresent()) {
            Book existingBook = existingBookOpt.get();
            if (existingBook.isActive()) {
                throw new ResourceAlreadyExistsException("A book with ISBN " + book.getIsbn() + " already exists.");
            } else {
                existingBook.setTitle(book.getTitle());
                existingBook.setAuthor(book.getAuthor());
                existingBook.setGenre(book.getGenre());
                existingBook.setPublicationYear(book.getPublicationYear());
                existingBook.setTotalCopies(book.getTotalCopies());
                existingBook.setAvailableCopies(book.getAvailableCopies());
                existingBook.setActive(true);
                return bookRepository.save(existingBook);
            }
        }

        if (book.getAvailableCopies() > book.getTotalCopies()) {
            book.setAvailableCopies(book.getTotalCopies());
        }

        return bookRepository.save(book);
    }

    @Transactional
    public void deleteBook(Long id) {
        bookRepository.findActiveById(id).ifPresent(book -> {
            book.setActive(false);
            bookRepository.save(book);
        });
    }

    @Transactional
    public Book updateBook(Long id, Book bookDetails) {
        return bookRepository.findActiveById(id)
                .map(book -> {
                    book.setTitle(bookDetails.getTitle());
                    book.setAuthor(bookDetails.getAuthor());
                    book.setIsbn(bookDetails.getIsbn());
                    book.setGenre(bookDetails.getGenre());
                    book.setPublicationYear(bookDetails.getPublicationYear());
                    book.setTotalCopies(bookDetails.getTotalCopies());
                    book.setAvailableCopies(bookDetails.getAvailableCopies());
                    return bookRepository.save(book);
                }).orElseThrow(() -> new RuntimeException("Book not found with id " + id));
    }
}