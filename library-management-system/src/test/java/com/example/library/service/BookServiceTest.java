package com.example.library.service;

import com.example.library.dto.BookRequestDTO;
import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.model.Book;
import com.example.library.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private BookService bookService;

    private BookRequestDTO sampleRequest;

    @BeforeEach
    void setUp() {
        sampleRequest = BookRequestDTO.builder()
                .title("Clean Architecture")
                .author("Robert C. Martin")
                .isbn("9780134494166")
                .genre("Technology & Computing")
                .publicationYear(2017)
                .totalCopies(5)
                .availableCopies(5)
                .build();
    }

    @Test
    @DisplayName("addBook: Successfully creates and saves new book")
    void addBook_NewBook_SavesSuccessfully() {
        when(bookRepository.findAnyByIsbn("9780134494166")).thenReturn(Optional.empty());
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> {
            Book b = invocation.getArgument(0);
            b.setId(1L);
            return b;
        });

        Book created = bookService.addBook(sampleRequest);

        assertThat(created).isNotNull();
        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getTitle()).isEqualTo("Clean Architecture");
        assertThat(created.getAuthor()).isEqualTo("Robert C. Martin");
        assertThat(created.getAvailableCopies()).isEqualTo(5);
        assertThat(created.isActive()).isTrue();

        verify(bookRepository).save(any(Book.class));
    }

    @Test
    @DisplayName("addBook: Throws ResourceAlreadyExistsException if active book with same ISBN exists")
    void addBook_ActiveDuplicateIsbn_ThrowsException() {
        Book existing = new Book();
        existing.setId(2L);
        existing.setIsbn("9780134494166");
        existing.setActive(true);

        when(bookRepository.findAnyByIsbn("9780134494166")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> bookService.addBook(sampleRequest))
                .isInstanceOf(ResourceAlreadyExistsException.class)
                .hasMessageContaining("already exists");

        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    @DisplayName("addBook: Reactivates inactive book with same ISBN")
    void addBook_InactiveDuplicateIsbn_ReactivatesBook() {
        Book existing = new Book();
        existing.setId(3L);
        existing.setIsbn("9780134494166");
        existing.setActive(false);

        when(bookRepository.findAnyByIsbn("9780134494166")).thenReturn(Optional.of(existing));
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Book result = bookService.addBook(sampleRequest);

        assertThat(result.isActive()).isTrue();
        assertThat(result.getTitle()).isEqualTo("Clean Architecture");
        verify(bookRepository).save(existing);
    }

    @Test
    @DisplayName("updateBook: Updates book properties correctly")
    void updateBook_Valid_UpdatesProperties() {
        Book existing = new Book();
        existing.setId(10L);
        existing.setTitle("Old Title");
        existing.setAuthor("Old Author");
        existing.setIsbn("9780134494166");
        existing.setActive(true);

        when(bookRepository.findActiveById(10L)).thenReturn(Optional.of(existing));
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));

        sampleRequest.setTitle("Updated Architecture");
        Book updated = bookService.updateBook(10L, sampleRequest);

        assertThat(updated.getTitle()).isEqualTo("Updated Architecture");
        verify(bookRepository).save(existing);
    }

    @Test
    @DisplayName("updateBook: Throws ResourceNotFoundException for unknown ID")
    void updateBook_NotFound_ThrowsException() {
        when(bookRepository.findActiveById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookService.updateBook(99L, sampleRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleteBook: Soft deletes book by setting active to false")
    void deleteBook_ValidId_SetsActiveFalse() {
        Book existing = new Book();
        existing.setId(5L);
        existing.setActive(true);

        when(bookRepository.findActiveById(5L)).thenReturn(Optional.of(existing));

        bookService.deleteBook(5L);

        assertThat(existing.isActive()).isFalse();
        verify(bookRepository).save(existing);
    }
}
