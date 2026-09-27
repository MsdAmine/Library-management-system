package com.example.library.scheduler;

import com.example.library.model.*;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowingRecordRepository;
import com.example.library.repository.ReservationRepository;
import com.example.library.service.ReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OverdueAndExpirySchedulerTest {

    @Mock
    private BorrowingRecordRepository borrowingRecordRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ReservationService reservationService;

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private OverdueAndExpiryScheduler scheduler;

    private User sampleUser;
    private Book sampleBook;
    private BorrowingRecord overdueLoan;
    private Reservation expiredHold;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .firstName("Alice")
                .lastName("Smith")
                .email("alice@example.com")
                .role(Role.USER)
                .membershipDate(LocalDate.of(2025, 1, 1))
                .active(true)
                .build();

        sampleBook = new Book();
        sampleBook.setId(10L);
        sampleBook.setTitle("Clean Code");
        sampleBook.setAuthor("Robert Martin");
        sampleBook.setTotalCopies(3);
        sampleBook.setAvailableCopies(0);
        sampleBook.setActive(true);

        overdueLoan = BorrowingRecord.builder()
                .id(100L)
                .user(sampleUser)
                .book(sampleBook)
                .borrowDate(LocalDate.now().minusDays(20))
                .dueDate(LocalDate.now().minusDays(6))
                .status(BorrowingRecord.BorrowingStatus.BORROWED)
                .build();

        expiredHold = Reservation.builder()
                .id(200L)
                .member(sampleUser)
                .book(sampleBook)
                .reservationDate(LocalDateTime.now().minusDays(3))
                .status(ReservationStatus.HELD_FOR_PICKUP)
                .pickupDeadline(LocalDateTime.now().minusHours(2))
                .build();
    }

    // -------------------------------------------------------------------------
    // Task 1: sweepOverdueBorrowings
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("sweepOverdueBorrowings: Transitions all BORROWED past-due loans to OVERDUE")
    void sweepOverdueBorrowings_TransitionsOverdueLoansToOverdue() {
        when(borrowingRecordRepository.findByStatusAndDueDateBefore(
                BorrowingRecord.BorrowingStatus.BORROWED, LocalDate.now()))
                .thenReturn(List.of(overdueLoan));
        when(borrowingRecordRepository.save(any(BorrowingRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        int count = scheduler.sweepOverdueBorrowings();

        assertThat(count).isEqualTo(1);
        assertThat(overdueLoan.getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.OVERDUE);

        ArgumentCaptor<BorrowingRecord> captor = ArgumentCaptor.forClass(BorrowingRecord.class);
        verify(borrowingRecordRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.OVERDUE);
    }

    @Test
    @DisplayName("sweepOverdueBorrowings: Transitions multiple BORROWED loans at once")
    void sweepOverdueBorrowings_TransitionsMultipleOverdueLoans() {
        BorrowingRecord loan2 = BorrowingRecord.builder()
                .id(101L)
                .user(sampleUser)
                .book(sampleBook)
                .borrowDate(LocalDate.now().minusDays(30))
                .dueDate(LocalDate.now().minusDays(14))
                .status(BorrowingRecord.BorrowingStatus.BORROWED)
                .build();

        when(borrowingRecordRepository.findByStatusAndDueDateBefore(
                BorrowingRecord.BorrowingStatus.BORROWED, LocalDate.now()))
                .thenReturn(List.of(overdueLoan, loan2));
        when(borrowingRecordRepository.save(any(BorrowingRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        int count = scheduler.sweepOverdueBorrowings();

        assertThat(count).isEqualTo(2);
        assertThat(overdueLoan.getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.OVERDUE);
        assertThat(loan2.getStatus()).isEqualTo(BorrowingRecord.BorrowingStatus.OVERDUE);
        verify(borrowingRecordRepository, times(2)).save(any(BorrowingRecord.class));
    }

    @Test
    @DisplayName("sweepOverdueBorrowings: Returns 0 when no overdue loans exist")
    void sweepOverdueBorrowings_ReturnsZero_WhenNoOverdueLoans() {
        when(borrowingRecordRepository.findByStatusAndDueDateBefore(
                BorrowingRecord.BorrowingStatus.BORROWED, LocalDate.now()))
                .thenReturn(List.of());

        int count = scheduler.sweepOverdueBorrowings();

        assertThat(count).isEqualTo(0);
        verify(borrowingRecordRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // Task 2: sweepExpiredHoldPickups
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("sweepExpiredHoldPickups: Marks expired hold as EXPIRED and cascades to next queued patron")
    void sweepExpiredHoldPickups_MarksExpiredAndCascadesToNextPatron() {
        User nextUser = User.builder()
                .id(2L)
                .firstName("Bob")
                .lastName("Jones")
                .email("bob@example.com")
                .build();

        Reservation nextHold = Reservation.builder()
                .id(201L)
                .member(nextUser)
                .book(sampleBook)
                .reservationDate(LocalDateTime.now().minusDays(1))
                .status(ReservationStatus.PENDING)
                .build();

        when(reservationRepository.findByStatusAndPickupDeadlineBefore(
                eq(ReservationStatus.HELD_FOR_PICKUP), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredHold));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(reservationService.transitionNextHoldToPickup(10L))
                .thenReturn(Optional.of(nextHold));

        int count = scheduler.sweepExpiredHoldPickups();

        assertThat(count).isEqualTo(1);
        assertThat(expiredHold.getStatus()).isEqualTo(ReservationStatus.EXPIRED);

        // Copy goes to next patron — stock should NOT be restored
        verify(reservationService).transitionNextHoldToPickup(10L);
        verify(bookRepository, never()).incrementAvailableCopies(any());
    }

    @Test
    @DisplayName("sweepExpiredHoldPickups: Marks expired hold as EXPIRED and restores stock when no next patron")
    void sweepExpiredHoldPickups_MarksExpiredAndRestoresStock_WhenNoNextPatron() {
        when(reservationRepository.findByStatusAndPickupDeadlineBefore(
                eq(ReservationStatus.HELD_FOR_PICKUP), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredHold));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(reservationService.transitionNextHoldToPickup(10L))
                .thenReturn(Optional.empty());

        int count = scheduler.sweepExpiredHoldPickups();

        assertThat(count).isEqualTo(1);
        assertThat(expiredHold.getStatus()).isEqualTo(ReservationStatus.EXPIRED);

        // No next patron — stock must be restored
        verify(reservationService).transitionNextHoldToPickup(10L);
        verify(bookRepository).incrementAvailableCopies(10L);
    }

    @Test
    @DisplayName("sweepExpiredHoldPickups: Returns 0 when no expired holds exist")
    void sweepExpiredHoldPickups_ReturnsZero_WhenNoExpiredHolds() {
        when(reservationRepository.findByStatusAndPickupDeadlineBefore(
                eq(ReservationStatus.HELD_FOR_PICKUP), any(LocalDateTime.class)))
                .thenReturn(List.of());

        int count = scheduler.sweepExpiredHoldPickups();

        assertThat(count).isEqualTo(0);
        verify(reservationRepository, never()).save(any());
        verify(bookRepository, never()).incrementAvailableCopies(any());
    }

    @Test
    @DisplayName("sweepExpiredHoldPickups: Processes multiple expired holds in one sweep")
    void sweepExpiredHoldPickups_ProcessesMultipleExpiredHolds() {
        Book book2 = new Book();
        book2.setId(11L);
        book2.setTitle("Domain-Driven Design");
        book2.setTotalCopies(2);
        book2.setAvailableCopies(0);

        Reservation expiredHold2 = Reservation.builder()
                .id(202L)
                .member(sampleUser)
                .book(book2)
                .reservationDate(LocalDateTime.now().minusDays(4))
                .status(ReservationStatus.HELD_FOR_PICKUP)
                .pickupDeadline(LocalDateTime.now().minusHours(5))
                .build();

        when(reservationRepository.findByStatusAndPickupDeadlineBefore(
                eq(ReservationStatus.HELD_FOR_PICKUP), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredHold, expiredHold2));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // Book 10 has next patron, book 11 does not
        when(reservationService.transitionNextHoldToPickup(10L))
                .thenReturn(Optional.of(Reservation.builder().id(300L).build()));
        when(reservationService.transitionNextHoldToPickup(11L))
                .thenReturn(Optional.empty());

        int count = scheduler.sweepExpiredHoldPickups();

        assertThat(count).isEqualTo(2);
        assertThat(expiredHold.getStatus()).isEqualTo(ReservationStatus.EXPIRED);
        assertThat(expiredHold2.getStatus()).isEqualTo(ReservationStatus.EXPIRED);

        verify(bookRepository, never()).incrementAvailableCopies(10L);
        verify(bookRepository).incrementAvailableCopies(11L);
        verify(reservationRepository, times(2)).save(any(Reservation.class));
    }
}
