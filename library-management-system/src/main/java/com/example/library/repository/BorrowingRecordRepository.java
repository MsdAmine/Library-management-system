package com.example.library.repository;

import com.example.library.model.BorrowingRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BorrowingRecordRepository extends JpaRepository<BorrowingRecord, Long> {
    Page<BorrowingRecord> findByMemberId(Long memberId, Pageable pageable);
    Page<BorrowingRecord> findByMemberIdAndArchivedFalse(Long memberId, Pageable pageable);
    List<BorrowingRecord> findByMemberIdAndStatus(Long memberId, BorrowingRecord.BorrowingStatus status);
    List<BorrowingRecord> findByBookId(Long bookId);
    List<BorrowingRecord> findByArchivedTrue();
    long countByMemberIdAndStatus(Long memberId, BorrowingRecord.BorrowingStatus status);
    long countByStatus(BorrowingRecord.BorrowingStatus status);

    @Query("SELECT COUNT(r) FROM BorrowingRecord r WHERE r.status = 'BORROWED' AND r.dueDate < :today")
    long countOverdue(LocalDate today);

    @Query("SELECT COUNT(DISTINCT r.member) FROM BorrowingRecord r WHERE r.status = 'BORROWED'")
    long countActiveMembers();

    @Query("SELECT COALESCE(SUM(r.fineAmount), 0) FROM BorrowingRecord r WHERE r.status = 'RETURNED' AND r.fineAmount > 0")
    BigDecimal sumFinesCollected();

    @Modifying
    @Query("UPDATE BorrowingRecord r SET r.archived = true, r.archivedAt = :now " +
           "WHERE r.status = 'RETURNED' AND r.returnDate <= :cutoffDate AND r.archived = false")
    int archiveReturnedBefore(@Param("cutoffDate") LocalDate cutoffDate, @Param("now") LocalDateTime now);
}
