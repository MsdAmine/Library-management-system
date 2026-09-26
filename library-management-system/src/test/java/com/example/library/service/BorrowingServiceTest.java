package com.example.library.service;

import com.example.library.exception.BookNotAvailableException;
import com.example.library.exception.OutstandingFineException;
import com.example.library.model.*;
import com.example.library.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    @Mock
    private ReservationRepository reservationRepository;

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
    @DisplayName("borrowBook: Allows borrowing when member has HELD_FOR_PICKUP hold without decrementing availableCopies")
    void borrowBook_FulfillsHeldForPickup_WithoutDecrementingAvailableCopies() {
        Reservation pickupHold = Reservation.builder()
                .id(100L)
                .member(sampleUser)
                .book(sampleBook)
                .status(ReservationStatus.HELD_FOR_PICKUP)
                .pickupDeadline(LocalDateTime.now().plusHours(40))
                .build();

        when(userRepository.findActiveById(1L)).thenReturn(Optional.of(sampleUser));
        when(fineRepository.sumAmountByMemberIdAndStatus(1L, FineStatus.PENDING))
                .thenReturn(BigDecimal.ZERO);
        when(borrowingRecordRepository.countByUserIdAndStatus(1L, BorrowingRecord.BorrowingStatus.BORROWED))
                .thenReturn(0L);
        when(bookRepository.findById(5L)).thenReturn(Optional.of(sampleBook));
        when(reservationRepository.findFirstByMemberIdAndBookIdAndStatus(1L, 5L, ReservationStatus.HELD_FOR_PICKUP))
                .thenReturn(Optional.of(pickupHold));
        when(borrowingRecordRepository.save(any(BorrowingRecord.class))).thenAnswer(i -> i.getArgument(0));

        BorrowingRecord record = borrowingService.borrowBook(1L, 5L);

        assertThat(record).isNotNull();
        assertThat(record.getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.BORROWED);
        assertThat(pickupHold.getStatus()).isEqualTo(ReservationStatus.FULFILLED);

        verify(reservationRepository).save(pickupHold);
        verify(bookRepository, never()).decrementAvailableCopies(any());
        verify(borrowingRecordRepository).save(any(BorrowingRecord.class));
    }

    @Test
    @DisplayName("borrowBook: Allows general borrowing when member has no pickup hold and copies are available")
    void borrowBook_AllowsBorrowing_WhenGeneralCopiesAvailable() {
        when(userRepository.findActiveById(1L)).thenReturn(Optional.of(sampleUser));
        when(fineRepository.sumAmountByMemberIdAndStatus(1L, FineStatus.PENDING))
                .thenReturn(new BigDecimal("5.00"));
        when(borrowingRecordRepository.countByUserIdAndStatus(1L, BorrowingRecord.BorrowingStatus.BORROWED))
                .thenReturn(1L);
        when(bookRepository.findById(5L)).thenReturn(Optional.of(sampleBook));
        when(reservationRepository.findFirstByMemberIdAndBookIdAndStatus(1L, 5L, ReservationStatus.HELD_FOR_PICKUP))
                .thenReturn(Optional.empty());
        when(bookRepository.decrementAvailableCopies(5L)).thenReturn(1);
        when(reservationRepository.findFirstByMemberIdAndBookIdAndStatus(1L, 5L, ReservationStatus.PENDING))
                .thenReturn(Optional.empty());
        when(borrowingRecordRepository.save(any(BorrowingRecord.class))).thenAnswer(i -> i.getArgument(0));

        BorrowingRecord record = borrowingService.borrowBook(1L, 5L);

        assertThat(record).isNotNull();
        assertThat(record.getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.BORROWED);
        verify(bookRepository).decrementAvailableCopies(5L);
        verify(borrowingRecordRepository).save(any(BorrowingRecord.class));
    }

    @Test
    @DisplayName("borrowBook: Throws BookNotAvailableException when 0 copies and user has no pickup hold")
    void borrowBook_ThrowsException_WhenZeroCopiesAndNoPickupHold() {
        when(userRepository.findActiveById(1L)).thenReturn(Optional.of(sampleUser));
        when(fineRepository.sumAmountByMemberIdAndStatus(1L, FineStatus.PENDING)).thenReturn(BigDecimal.ZERO);
        when(borrowingRecordRepository.countByUserIdAndStatus(1L, BorrowingRecord.BorrowingStatus.BORROWED)).thenReturn(0L);
        when(bookRepository.findById(5L)).thenReturn(Optional.of(sampleBook));
        when(reservationRepository.findFirstByMemberIdAndBookIdAndStatus(1L, 5L, ReservationStatus.HELD_FOR_PICKUP))
                .thenReturn(Optional.empty());
        when(bookRepository.decrementAvailableCopies(5L)).thenReturn(0);

        assertThatThrownBy(() -> borrowingService.borrowBook(1L, 5L))
                .isInstanceOf(BookNotAvailableException.class)
                .hasMessageContaining("No copies available for book");

        verify(borrowingRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("returnBook: Transitions top pending hold to HELD_FOR_PICKUP without incrementing availableCopies")
    void returnBook_QuarantinesCopy_WhenPendingHoldsExist() {
        User queuedUser = User.builder().id(2L).firstName("Alice").lastName("Wonder").build();
        Reservation pendingHold = Reservation.builder()
                .id(200L)
                .member(queuedUser)
                .book(sampleBook)
                .status(ReservationStatus.PENDING)
                .reservationDate(LocalDateTime.now().minusDays(1))
                .build();

        when(borrowingRecordRepository.findById(10L)).thenReturn(Optional.of(sampleRecord));
        when(reservationRepository.findFirstByBookIdAndStatusOrderByReservationDateAsc(5L, ReservationStatus.PENDING))
                .thenReturn(Optional.of(pendingHold));
        when(borrowingRecordRepository.save(any(BorrowingRecord.class))).thenAnswer(i -> i.getArgument(0));

        BorrowingRecord returned = borrowingService.returnBook(10L);

        assertThat(returned.getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.RETURNED);
        assertThat(pendingHold.getStatus()).isEqualTo(ReservationStatus.HELD_FOR_PICKUP);
        assertThat(pendingHold.getPickupDeadline()).isNotNull();

        verify(reservationRepository).save(pendingHold);
        verify(bookRepository, never()).incrementAvailableCopies(any());
    }

    @Test
    @DisplayName("returnBook: Restores availableCopies when no pending holds exist on return")
    void returnBook_RestoresAvailableCopies_WhenNoHoldsExist() {
        sampleRecord.setDueDate(LocalDate.now().plusDays(2)); // On time
        when(borrowingRecordRepository.findById(10L)).thenReturn(Optional.of(sampleRecord));
        when(reservationRepository.findFirstByBookIdAndStatusOrderByReservationDateAsc(5L, ReservationStatus.PENDING))
                .thenReturn(Optional.empty());
        when(bookRepository.incrementAvailableCopies(5L)).thenReturn(1);
        when(borrowingRecordRepository.save(any(BorrowingRecord.class))).thenAnswer(i -> i.getArgument(0));

        BorrowingRecord returned = borrowingService.returnBook(10L);

        assertThat(returned.getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.RETURNED);
        verify(bookRepository).incrementAvailableCopies(5L);
    }
}
