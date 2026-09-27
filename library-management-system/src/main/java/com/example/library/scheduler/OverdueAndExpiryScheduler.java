package com.example.library.scheduler;

import com.example.library.model.BorrowingRecord;
import com.example.library.model.BorrowingRecord.BorrowingStatus;
import com.example.library.model.Reservation;
import com.example.library.model.ReservationStatus;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowingRecordRepository;
import com.example.library.repository.ReservationRepository;
import com.example.library.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class OverdueAndExpiryScheduler {

    private final BorrowingRecordRepository borrowingRecordRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationService reservationService;
    private final BookRepository bookRepository;

    /**
     * Task 1: Overdue Loan Sweep
     * Runs daily at 1:00 AM (0 0 1 * * ?).
     * Identifies active loans whose due date is in the past and updates status to OVERDUE.
     *
     * @return Number of borrowing records updated to OVERDUE status
     */
    @Scheduled(cron = "${app.scheduler.overdue-sweep.cron:0 0 1 * * ?}")
    @Transactional
    public int sweepOverdueBorrowings() {
        LocalDate today = LocalDate.now();
        log.info("Starting scheduled overdue borrowing sweep for date: {}", today);

        List<BorrowingRecord> overdueLoans = borrowingRecordRepository.findByStatusAndDueDateBefore(
                BorrowingStatus.BORROWED, today
        );

        int updatedCount = 0;
        for (BorrowingRecord record : overdueLoans) {
            record.setStatus(BorrowingStatus.OVERDUE);
            borrowingRecordRepository.save(record);
            updatedCount++;

            String bookTitle = record.getBook() != null ? record.getBook().getTitle() : "N/A";
            String userEmail = record.getUser() != null ? record.getUser().getEmail() : "N/A";
            log.info("Audit: Loan id={} (book='{}', patron='{}', dueDate={}) transitioned from BORROWED to OVERDUE",
                    record.getId(), bookTitle, userEmail, record.getDueDate());
        }

        log.info("Completed scheduled overdue borrowing sweep. Total loans transitioned to OVERDUE: {}", updatedCount);
        return updatedCount;
    }

    /**
     * Task 2: Expired Hold Reservation Sweep
     * Runs every 15 minutes (0 * / 15 * * * ?).
     * Sweeps HELD_FOR_PICKUP reservations past their pickup deadline, marks them EXPIRED,
     * and either cascades the quarantined copy to the next queued patron or restores available stock.
     *
     * @return Number of expired reservations processed
     */
    @Scheduled(cron = "${app.scheduler.expiry-sweep.cron:0 */15 * * * ?}")
    @Transactional
    public int sweepExpiredHoldPickups() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Starting scheduled expired hold reservation sweep at: {}", now);

        List<Reservation> expiredHolds = reservationRepository.findByStatusAndPickupDeadlineBefore(
                ReservationStatus.HELD_FOR_PICKUP, now
        );

        int expiredCount = 0;
        for (Reservation reservation : expiredHolds) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);
            expiredCount++;

            Long bookId = reservation.getBook() != null ? reservation.getBook().getId() : null;
            String memberEmail = reservation.getMember() != null ? reservation.getMember().getEmail() : "N/A";
            log.info("Audit: Reservation id={} for bookId={} by patron='{}' marked EXPIRED (deadline was {})",
                    reservation.getId(), bookId, memberEmail, reservation.getPickupDeadline());

            if (bookId != null) {
                // Cascade copy to the next queued patron if a pending hold exists
                Optional<Reservation> nextHold = reservationService.transitionNextHoldToPickup(bookId);
                if (nextHold.isPresent()) {
                    Reservation next = nextHold.get();
                    String nextPatron = next.getMember() != null ? next.getMember().getEmail() : "N/A";
                    log.info("Audit: Quarantined copy for bookId={} cascaded to next reservation id={} for patron='{}' with deadline {}",
                            bookId, next.getId(), nextPatron, next.getPickupDeadline());
                } else {
                    // No further pending holds in queue -> restore stock to available inventory
                    bookRepository.incrementAvailableCopies(bookId);
                    log.info("Audit: No remaining holds for bookId={}. Restored 1 copy to available inventory.", bookId);
                }
            }
        }

        log.info("Completed scheduled expired hold reservation sweep. Total holds expired: {}", expiredCount);
        return expiredCount;
    }
}
