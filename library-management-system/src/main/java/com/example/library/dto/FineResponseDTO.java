package com.example.library.dto;

import com.example.library.model.FineStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FineResponseDTO {
    private Long id;
    private Long borrowingRecordId;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookIsbn;
    private Long memberId;
    private String memberName;
    private String memberEmail;
    private BigDecimal amount;
    private FineStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime settledAt;
    private String paymentReference;
    private String notes;
    private LocalDate dueDate;
    private LocalDate returnDate;
    private Long daysOverdue;
}
