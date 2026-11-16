package com.example.library.dto;

import com.example.library.model.BorrowingRecord;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Explicit response values prevent Hibernate proxies and account credentials leaking into JSON. */
public record BorrowingResponseDTO(
        Long id, MemberSummary user, BookSummary book, LocalDate borrowDate,
        LocalDate dueDate, LocalDate returnDate, BorrowingRecord.BorrowingStatus status,
        BigDecimal fineAmount, boolean archived, LocalDateTime archivedAt) {
    public record MemberSummary(Long id, String firstName, String lastName, String email) {}
    public record BookSummary(Long id, String title, String author, String isbn,
                              int totalCopies, int availableCopies) {}

    public static BorrowingResponseDTO from(BorrowingRecord loan) {
        var member = loan.getUser();
        var book = loan.getBook();
        return new BorrowingResponseDTO(loan.getId(),
                new MemberSummary(member.getId(), member.getFirstName(), member.getLastName(), member.getEmail()),
                new BookSummary(book.getId(), book.getTitle(), book.getAuthor(), book.getIsbn(),
                        book.getTotalCopies(), book.getAvailableCopies()),
                loan.getBorrowDate(), loan.getDueDate(), loan.getReturnDate(), loan.getStatus(),
                loan.getFineAmount(), loan.isArchived(), loan.getArchivedAt());
    }
}
