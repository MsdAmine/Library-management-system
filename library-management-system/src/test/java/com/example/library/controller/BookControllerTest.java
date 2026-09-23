package com.example.library.controller;

import com.example.library.dto.BookRequestDTO;
import com.example.library.exception.GlobalExceptionHandler;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.model.Book;
import com.example.library.service.BookService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class BookControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BookService bookService;

    @InjectMocks
    private BookController bookController;

    private ObjectMapper objectMapper;

    private Book sampleBook;
    private BookRequestDTO validRequest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(bookController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        objectMapper = new ObjectMapper();

        sampleBook = new Book();
        sampleBook.setId(1L);
        sampleBook.setTitle("Designing Data-Intensive Applications");
        sampleBook.setAuthor("Martin Kleppmann");
        sampleBook.setIsbn("9781449373320");
        sampleBook.setPublicationYear(2017);
        sampleBook.setGenre("Technology & Computing");
        sampleBook.setTotalCopies(10);
        sampleBook.setAvailableCopies(8);
        sampleBook.setActive(true);

        validRequest = BookRequestDTO.builder()
                .title("Designing Data-Intensive Applications")
                .author("Martin Kleppmann")
                .isbn("9781449373320")
                .publicationYear(2017)
                .genre("Technology & Computing")
                .totalCopies(10)
                .availableCopies(8)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/books: Returns paginated book response")
    void getAllBooks_ReturnsOkWithPage() throws Exception {
        Page<Book> bookPage = new PageImpl<>(List.of(sampleBook), PageRequest.of(0, 10), 1);
        when(bookService.getAllBooks(any())).thenReturn(bookPage);

        mockMvc.perform(get("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title", is("Designing Data-Intensive Applications")))
                .andExpect(jsonPath("$.content[0].borrowedCopies", is(2)));
    }

    @Test
    @DisplayName("GET /api/v1/books/{id}: Returns single book when found")
    void getBookById_Found_ReturnsOk() throws Exception {
        when(bookService.getBookById(1L)).thenReturn(Optional.of(sampleBook));

        mockMvc.perform(get("/api/v1/books/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is("Designing Data-Intensive Applications")));
    }

    @Test
    @DisplayName("GET /api/v1/books/{id}: Returns 404 when not found")
    void getBookById_NotFound_Returns404() throws Exception {
        when(bookService.getBookById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/books/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/books: Creates book when valid payload is passed")
    void addBook_ValidPayload_Returns201() throws Exception {
        when(bookService.addBook(any(BookRequestDTO.class))).thenReturn(sampleBook);

        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Designing Data-Intensive Applications")))
                .andExpect(jsonPath("$.isbn", is("9781449373320")));
    }

    @Test
    @DisplayName("POST /api/v1/books: Returns 400 Bad Request with field errors when invalid payload is passed")
    void addBook_InvalidPayload_Returns400WithFieldErrors() throws Exception {
        BookRequestDTO invalid = BookRequestDTO.builder()
                .title("") // Blank title
                .author("") // Blank author
                .publicationYear(900) // Min is 1000
                .build();

        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.title", is("Title is required")))
                .andExpect(jsonPath("$.validationErrors.author", is("Author is required")));

        verify(bookService, never()).addBook(any(BookRequestDTO.class));
    }

    @Test
    @DisplayName("PUT /api/v1/books/{id}: Updates book when valid payload is passed")
    void updateBook_ValidPayload_ReturnsOk() throws Exception {
        when(bookService.updateBook(eq(1L), any(BookRequestDTO.class))).thenReturn(sampleBook);

        mockMvc.perform(put("/api/v1/books/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is("Designing Data-Intensive Applications")));
    }

    @Test
    @DisplayName("DELETE /api/v1/books/{id}: Deletes book and returns 204 No Content")
    void deleteBook_Returns204() throws Exception {
        doNothing().when(bookService).deleteBook(1L);

        mockMvc.perform(delete("/api/v1/books/1"))
                .andExpect(status().isNoContent());

        verify(bookService).deleteBook(1L);
    }
}
