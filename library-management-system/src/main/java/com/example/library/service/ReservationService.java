package com.example.library.service;

import com.example.library.dto.ReservationResponseDTO;
import com.example.library.exception.BookNotEligibleForHoldException;
import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.model.Book;
import com.example.library.model.Reservation;
import com.example.library.model.ReservationStatus;
import com.example.library.model.User;
import com.example.library.repository.BookRepository;
import com.example.library.repository.ReservationRepository;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReservationResponseDTO placeHold(Long memberId, Long bookId) {
        User member = userRepository.findActiveById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + memberId));

        Book book = bookRepository.findActiveById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id " + bookId));

        // Enforce constraint: Holds can only be placed if availableCopies == 0
        if (book.getAvailableCopies() > 0) {
            throw new BookNotEligibleForHoldException(
                    "Cannot place hold on '" + book.getTitle() + "': " + book.getAvailableCopies() + 
                    " copy/copies are available for direct borrowing."
            );
        }

        // Prevent duplicate active holds for the same member and book
        if (reservationRepository.existsByMemberIdAndBookIdAndStatus(memberId, bookId, ReservationStatus.PENDING)) {
            throw new ResourceAlreadyExistsException(
                    "Member already has an active hold request for book: " + book.getTitle()
            );
        }

        LocalDateTime now = LocalDateTime.now();
        Reservation reservation = Reservation.builder()
                .member(member)
                .book(book)
                .reservationDate(now)
                .status(ReservationStatus.PENDING)
                .build();

        Reservation savedReservation = reservationRepository.save(reservation);
        int queuePosition = calculateQueuePosition(savedReservation);

        return toDTO(savedReservation, queuePosition);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getMyHolds(Long memberId) {
        List<Reservation> reservations = reservationRepository.findByMemberIdOrderByReservationDateDesc(memberId);
        return reservations.stream()
                .map(r -> {
                    Integer pos = r.getStatus() == ReservationStatus.PENDING ? calculateQueuePosition(r) : null;
                    return toDTO(r, pos);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getBookHoldQueue(Long bookId) {
        Book book = bookRepository.findActiveById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id " + bookId));

        List<Reservation> queue = reservationRepository.findByBookIdAndStatusOrderByReservationDateAsc(
                book.getId(), ReservationStatus.PENDING
        );

        AtomicInteger rank = new AtomicInteger(1);
        return queue.stream()
                .map(r -> toDTO(r, rank.getAndIncrement()))
                .toList();
    }

    @Transactional
    public ReservationResponseDTO cancelHold(Long reservationId, Long requestingUserId, boolean isStaff) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id " + reservationId));

        // Authorization check: Only staff or the owner can cancel
        if (!isStaff && !reservation.getMember().getId().equals(requestingUserId)) {
            throw new AccessDeniedException("You do not have permission to cancel this hold.");
        }

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalStateException("Only active pending reservations can be cancelled. Current status: " + reservation.getStatus());
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation saved = reservationRepository.save(reservation);

        return toDTO(saved, null);
    }

    @Transactional
    public ReservationResponseDTO fulfillReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id " + reservationId));

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalStateException("Only active pending reservations can be fulfilled. Current status: " + reservation.getStatus());
        }

        reservation.setStatus(ReservationStatus.FULFILLED);
        Reservation saved = reservationRepository.save(reservation);

        return toDTO(saved, null);
    }

    @Transactional
    public Optional<ReservationResponseDTO> fulfillNextPendingHold(Long bookId) {
        Optional<Reservation> nextInQueue = reservationRepository.findFirstByBookIdAndStatusOrderByReservationDateAsc(
                bookId, ReservationStatus.PENDING
        );

        if (nextInQueue.isEmpty()) {
            return Optional.empty();
        }

        Reservation reservation = nextInQueue.get();
        reservation.setStatus(ReservationStatus.FULFILLED);
        Reservation saved = reservationRepository.save(reservation);

        return Optional.of(toDTO(saved, null));
    }

    @Transactional(readOnly = true)
    public long countPendingHolds(Long bookId) {
        return reservationRepository.countByBookIdAndStatus(bookId, ReservationStatus.PENDING);
    }

    public int calculateQueuePosition(Reservation reservation) {
        if (reservation == null || reservation.getBook() == null || reservation.getStatus() != ReservationStatus.PENDING) {
            return 0;
        }

        long countAheadOrEqual = reservationRepository.countByBookIdAndStatusAndReservationDateLessThanEqual(
                reservation.getBook().getId(),
                ReservationStatus.PENDING,
                reservation.getReservationDate()
        );

        return Math.max(1, (int) countAheadOrEqual);
    }

    public ReservationResponseDTO toDTO(Reservation reservation, Integer queuePosition) {
        if (reservation == null) return null;

        return ReservationResponseDTO.builder()
                .id(reservation.getId())
                .bookId(reservation.getBook() != null ? reservation.getBook().getId() : null)
                .bookTitle(reservation.getBook() != null ? reservation.getBook().getTitle() : null)
                .bookAuthor(reservation.getBook() != null ? reservation.getBook().getAuthor() : null)
                .bookIsbn(reservation.getBook() != null ? reservation.getBook().getIsbn() : null)
                .bookAvailableCopies(reservation.getBook() != null ? reservation.getBook().getAvailableCopies() : null)
                .memberId(reservation.getMember() != null ? reservation.getMember().getId() : null)
                .memberName(reservation.getMember() != null ? (reservation.getMember().getFirstName() + " " + reservation.getMember().getLastName()).trim() : null)
                .memberEmail(reservation.getMember() != null ? reservation.getMember().getEmail() : null)
                .reservationDate(reservation.getReservationDate())
                .status(reservation.getStatus())
                .queuePosition(queuePosition)
                .createdAt(reservation.getCreatedAt())
                .updatedAt(reservation.getUpdatedAt())
                .build();
    }
}
