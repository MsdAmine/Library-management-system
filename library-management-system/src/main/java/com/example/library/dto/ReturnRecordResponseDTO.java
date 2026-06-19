package com.example.library.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class ReturnRecordResponseDTO {
    private final Long recordId;
    private final String bookTitle;
    private final String bookIsbn;
    private final String memberName;
    private final LocalDate borrowDate;
    private final LocalDate dueDate;
    private final LocalDate returnDate;
    private final boolean overdue;
    private final long daysOverdue;
    private final BigDecimal fineAmount;
}
