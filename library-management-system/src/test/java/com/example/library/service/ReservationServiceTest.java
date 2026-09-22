package com.example.library.service;

import com.example.library.dto.ReservationResponseDTO;
import com.example.library.exception.BookNotEligibleForHoldException;
import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.model.*;
import com.example.library.repository.BookRepository;
import com.example.library.repository.ReservationRepository;
import com.example.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReservationService reservationService;

    private User sampleUser;
    private Book sampleBook;
    private Reservation sampleReservation;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(10L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .role(Role.USER)
                .membershipDate(LocalDate.of(2026, 1, 1))
                .active(true)
                .build();

        sampleBook = new Book();
        sampleBook.setId(20L);
        sampleBook.setTitle("Designing Data-Intensive Applications");
        sampleBook.setAuthor("Martin Kleppmann");
        sampleBook.setIsbn("9781449373320");
        sampleBook.setPublicationYear(2017);
        sampleBook.setTotalCopies(3);
        sampleBook.setAvailableCopies(0); // 0 available copies
        sampleBook.setActive(true);

        sampleReservation = Reservation.builder()
                .id(100L)
                .member(sampleUser)
                .book(sampleBook)
                .reservationDate(LocalDateTime.of(2026, 9, 22, 12, 0))
                .status(ReservationStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("placeHold: Succeeds when availableCopies is 0 and no duplicate pending hold exists")
    void placeHold_Success_WhenAvailableCopiesZero() {
        when(userRepository.findActiveById(10L)).thenReturn(Optional.of(sampleUser));
        when(bookRepository.findActiveById(20L)).thenReturn(Optional.of(sampleBook));
        when(reservationRepository.existsByMemberIdAndBookIdAndStatus(10L, 20L, ReservationStatus.PENDING)).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation r = invocation.getArgument(0);
            r.setId(100L);
            return r;
        });
        when(reservationRepository.countByBookIdAndStatusAndReservationDateLessThanEqual(eq(20L), eq(ReservationStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(1L);

        ReservationResponseDTO result = reservationService.placeHold(10L, 20L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(100L);
        assertThat(result.getBookId()).isEqualTo(20L);
        assertThat(result.getBookTitle()).isEqualTo("Designing Data-Intensive Applications");
        assertThat(result.getMemberId()).isEqualTo(10L);
        assertThat(result.getStatus()).isEqualTo(ReservationStatus.PENDING);
        assertThat(result.getQueuePosition()).isEqualTo(1);

        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    @DisplayName("placeHold: Throws BookNotEligibleForHoldException when availableCopies > 0")
    void placeHold_ThrowsException_WhenAvailableCopiesGreaterThanZero() {
        sampleBook.setAvailableCopies(2); // In stock
        when(userRepository.findActiveById(10L)).thenReturn(Optional.of(sampleUser));
        when(bookRepository.findActiveById(20L)).thenReturn(Optional.of(sampleBook));

        assertThatThrownBy(() -> reservationService.placeHold(10L, 20L))
                .isInstanceOf(BookNotEligibleForHoldException.class)
                .hasMessageContaining("copies are available for direct borrowing");

        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("placeHold: Throws ResourceAlreadyExistsException when member already has a pending hold")
    void placeHold_ThrowsException_WhenDuplicateHold() {
        when(userRepository.findActiveById(10L)).thenReturn(Optional.of(sampleUser));
        when(bookRepository.findActiveById(20L)).thenReturn(Optional.of(sampleBook));
        when(reservationRepository.existsByMemberIdAndBookIdAndStatus(10L, 20L, ReservationStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> reservationService.placeHold(10L, 20L))
                .isInstanceOf(ResourceAlreadyExistsException.class)
                .hasMessageContaining("Member already has an active hold request");

        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("placeHold: Throws ResourceNotFoundException when user or book does not exist")
    void placeHold_ThrowsException_WhenUserOrBookNotFound() {
        when(userRepository.findActiveById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.placeHold(99L, 20L))
                .isInstanceOf(ResourceNotFoundException.class);

        when(userRepository.findActiveById(10L)).thenReturn(Optional.of(sampleUser));
        when(bookRepository.findActiveById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.placeHold(10L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getMyHolds: Returns member's holds with queue positions for pending holds")
    void getMyHolds_ReturnsHoldsWithQueuePositions() {
        Reservation fulfilled = Reservation.builder()
                .id(101L)
                .member(sampleUser)
                .book(sampleBook)
                .reservationDate(LocalDateTime.of(2026, 9, 1, 10, 0))
                .status(ReservationStatus.FULFILLED)
                .build();

        when(reservationRepository.findByMemberIdOrderByReservationDateDesc(10L))
                .thenReturn(List.of(sampleReservation, fulfilled));
        when(reservationRepository.countByBookIdAndStatusAndReservationDateLessThanEqual(eq(20L), eq(ReservationStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(2L);

        List<ReservationResponseDTO> results = reservationService.getMyHolds(10L);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getId()).isEqualTo(100L);
        assertThat(results.get(0).getQueuePosition()).isEqualTo(2);
        assertThat(results.get(1).getId()).isEqualTo(101L);
        assertThat(results.get(1).getQueuePosition()).isNull(); // FULFILLED has no queue position
    }

    @Test
    @DisplayName("getBookHoldQueue: Returns active queue in FIFO order with incremental positions")
    void getBookHoldQueue_ReturnsFIFOOrder() {
        User user2 = User.builder().id(11L).firstName("Jane").lastName("Roe").email("jane@example.com").build();
        Reservation r2 = Reservation.builder()
                .id(102L)
                .member(user2)
                .book(sampleBook)
                .reservationDate(LocalDateTime.of(2026, 9, 22, 14, 0))
                .status(ReservationStatus.PENDING)
                .build();

        when(bookRepository.findActiveById(20L)).thenReturn(Optional.of(sampleBook));
        when(reservationRepository.findByBookIdAndStatusOrderByReservationDateAsc(20L, ReservationStatus.PENDING))
                .thenReturn(List.of(sampleReservation, r2));

        List<ReservationResponseDTO> queue = reservationService.getBookHoldQueue(20L);

        assertThat(queue).hasSize(2);
        assertThat(queue.get(0).getMemberName()).isEqualTo("John Doe");
        assertThat(queue.get(0).getQueuePosition()).isEqualTo(1);
        assertThat(queue.get(1).getMemberName()).isEqualTo("Jane Roe");
        assertThat(queue.get(1).getQueuePosition()).isEqualTo(2);
    }

    @Test
    @DisplayName("cancelHold: Member owner can cancel their own pending hold")
    void cancelHold_ByOwner_Success() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(sampleReservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservationResponseDTO result = reservationService.cancelHold(100L, 10L, false);

        assertThat(result.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        verify(reservationRepository).save(sampleReservation);
    }

    @Test
    @DisplayName("cancelHold: Staff (Admin / Librarian) can cancel any pending hold")
    void cancelHold_ByStaff_Success() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(sampleReservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservationResponseDTO result = reservationService.cancelHold(100L, 999L, true);

        assertThat(result.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        verify(reservationRepository).save(sampleReservation);
    }

    @Test
    @DisplayName("cancelHold: Throws AccessDeniedException when non-owner patron attempts cancellation")
    void cancelHold_ByUnauthorizedUser_ThrowsAccessDenied() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(sampleReservation));

        assertThatThrownBy(() -> reservationService.cancelHold(100L, 999L, false))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("do not have permission");

        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("cancelHold: Throws IllegalStateException when reservation is not PENDING")
    void cancelHold_WhenNotPending_ThrowsIllegalState() {
        sampleReservation.setStatus(ReservationStatus.FULFILLED);
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(sampleReservation));

        assertThatThrownBy(() -> reservationService.cancelHold(100L, 10L, false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only active pending reservations can be cancelled");
    }

    @Test
    @DisplayName("fulfillReservation: Marks reservation as FULFILLED")
    void fulfillReservation_Success() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(sampleReservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservationResponseDTO result = reservationService.fulfillReservation(100L);

        assertThat(result.getStatus()).isEqualTo(ReservationStatus.FULFILLED);
        verify(reservationRepository).save(sampleReservation);
    }

    @Test
    @DisplayName("fulfillNextPendingHold: Fulfills the oldest pending reservation for a book")
    void fulfillNextPendingHold_Success() {
        when(reservationRepository.findFirstByBookIdAndStatusOrderByReservationDateAsc(20L, ReservationStatus.PENDING))
                .thenReturn(Optional.of(sampleReservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<ReservationResponseDTO> result = reservationService.fulfillNextPendingHold(20L);

        assertThat(result).isPresent();
        assertThat(result.get().getStatus()).isEqualTo(ReservationStatus.FULFILLED);
    }
}
