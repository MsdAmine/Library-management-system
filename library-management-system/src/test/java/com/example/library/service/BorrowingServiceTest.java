package com.example.library.service;

import com.example.library.exception.OutstandingFineException;
import com.example.library.model.*;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowingRecordRepository;
import com.example.library.repository.FineRepository;
import com.example.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BorrowingServiceTest {

    @Mock
    private BorrowingRecordRepository borrowingRecordRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FineRepository fineRepository;

    @InjectMocks
    private BorrowingService borrowingService;

    private User sampleUser;
    private Book sampleBook;
    private BorrowingRecord sampleRecord;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .firstName("Bob")
                .lastName("Builder")
                .email("bob@example.com")
                .role(Role.USER)
                .membershipDate(LocalDate.of(2026, 1, 1))
                .active(true)
                .build();

        sampleBook = new Book();
        sampleBook.setId(5L);
        sampleBook.setTitle("Refactoring");
        sampleBook.setAuthor("Martin Fowler");
        sampleBook.setTotalCopies(3);
        sampleBook.setAvailableCopies(2);
        sampleBook.setActive(true);

        sampleRecord = BorrowingRecord.builder()
                .id(10L)
                .user(sampleUser)
                .book(sampleBook)
                .borrowDate(LocalDate.now().minusDays(20))
                .dueDate(LocalDate.now().minusDays(6))
                .status(BorrowingRecord.BorrowingStatus.BORROWED)
                .build();
    }

    @Test
    @DisplayName("borrowBook: Throws OutstandingFineException when member pending fines exceed $10.00")
    void borrowBook_ThrowsException_WhenOutstandingFinesExceedThreshold() {
        when(userRepository.findActiveById(1L)).thenReturn(Optional.of(sampleUser));
        when(fineRepository.sumAmountByMemberIdAndStatus(1L, FineStatus.PENDING))
                .thenReturn(new BigDecimal("12.50"));

        assertThatThrownBy(() -> borrowingService.borrowBook(1L, 5L))
                .isInstanceOf(OutstandingFineException.class)
                .hasMessageContaining("exceeding the allowed limit of $10.00");

        verify(bookRepository, never()).decrementAvailableCopies(any());
        verify(borrowingRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("borrowBook: Allows borrowing when member pending fines are $10.00 or below")
    void borrowBook_AllowsBorrowing_WhenFinesUnderThreshold() {
        when(userRepository.findActiveById(1L)).thenReturn(Optional.of(sampleUser));
        when(fineRepository.sumAmountByMemberIdAndStatus(1L, FineStatus.PENDING))
                .thenReturn(new BigDecimal("10.00"));
        when(borrowingRecordRepository.countByUserIdAndStatus(1L, BorrowingRecord.BorrowingStatus.BORROWED))
                .thenReturn(1L);
        when(bookRepository.findById(5L)).thenReturn(Optional.of(sampleBook));
        when(bookRepository.decrementAvailableCopies(5L)).thenReturn(1);
        when(borrowingRecordRepository.save(any(BorrowingRecord.class))).thenAnswer(i -> i.getArgument(0));

        BorrowingRecord record = borrowingService.borrowBook(1L, 5L);

        assertThat(record).isNotNull();
        assertThat(record.getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.BORROWED);
        verify(borrowingRecordRepository).save(any(BorrowingRecord.class));
    }

    @Test
    @DisplayName("returnBook: Creates PENDING Fine ledger record when book is overdue")
    void returnBook_CreatesFineRecord_WhenOverdue() {
        when(borrowingRecordRepository.findById(10L)).thenReturn(Optional.of(sampleRecord));
        when(bookRepository.incrementAvailableCopies(5L)).thenReturn(1);
        when(borrowingRecordRepository.save(any(BorrowingRecord.class))).thenAnswer(i -> i.getArgument(0));

        BorrowingRecord returned = borrowingService.returnBook(10L);

        assertThat(returned.getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.RETURNED);
        assertThat(returned.getFineAmount()).isGreaterThan(BigDecimal.ZERO);
        // Fine per day is $1.50 * 6 days overdue = $9.00
        assertThat(returned.getFineAmount()).isEqualByComparingTo(new BigDecimal("9.00"));

        verify(fineRepository).save(any(Fine.class));
    }

    @Test
    @DisplayName("returnBook: Does not create Fine record when book is returned on time")
    void returnBook_DoesNotCreateFineRecord_WhenOnTime() {
        sampleRecord.setDueDate(LocalDate.now().plusDays(2)); // Not overdue
        when(borrowingRecordRepository.findById(10L)).thenReturn(Optional.of(sampleRecord));
        when(bookRepository.incrementAvailableCopies(5L)).thenReturn(1);
        when(borrowingRecordRepository.save(any(BorrowingRecord.class))).thenAnswer(i -> i.getArgument(0));

        BorrowingRecord returned = borrowingService.returnBook(10L);

        assertThat(returned.getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.RETURNED);
        assertThat(returned.getFineAmount()).isEqualByComparingTo(BigDecimal.ZERO);

        verify(fineRepository, never()).save(any(Fine.class));
    }
}
