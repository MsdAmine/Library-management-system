package com.example.library.repository;

import com.example.library.model.Reservation;
import com.example.library.model.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByMemberIdOrderByReservationDateDesc(Long memberId);

    List<Reservation> findByMemberIdAndStatusOrderByReservationDateDesc(Long memberId, ReservationStatus status);

    List<Reservation> findByMemberIdAndStatusInOrderByReservationDateDesc(Long memberId, List<ReservationStatus> statuses);

    Page<Reservation> findByMemberId(Long memberId, Pageable pageable);

    List<Reservation> findByBookIdAndStatusOrderByReservationDateAsc(Long bookId, ReservationStatus status);

    Optional<Reservation> findFirstByBookIdAndStatusOrderByReservationDateAsc(Long bookId, ReservationStatus status);

    boolean existsByMemberIdAndBookIdAndStatus(Long memberId, Long bookId, ReservationStatus status);

    long countByBookIdAndStatus(Long bookId, ReservationStatus status);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.book.id = :bookId AND r.status = :status AND r.reservationDate <= :reservationDate")
    long countByBookIdAndStatusAndReservationDateLessThanEqual(
            @Param("bookId") Long bookId,
            @Param("status") ReservationStatus status,
            @Param("reservationDate") LocalDateTime reservationDate
    );
}
