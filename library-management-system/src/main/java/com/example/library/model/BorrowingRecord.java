package com.example.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "borrowing_records")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class BorrowingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(nullable = false)
    private LocalDate borrowDate;

    @Column(nullable = false)
    private LocalDate dueDate;

    private LocalDate returnDate;

    @Enumerated(EnumType.STRING)
    private BorrowingStatus status;

    private BigDecimal fineAmount;

    @Column(nullable = false)
    private boolean archived = false;

    private LocalDateTime archivedAt;

    public enum BorrowingStatus {
        BORROWED, RETURNED, OVERDUE
    }
}
