package com.example.library.repository;

import com.example.library.model.BorrowingRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BorrowingRecordRepository extends JpaRepository<BorrowingRecord, Long> {
    Page<BorrowingRecord> findByMemberId(Long memberId, Pageable pageable);
    List<BorrowingRecord> findByBookId(Long bookId);
    long countByMemberIdAndStatus(Long memberId, BorrowingRecord.BorrowingStatus status);
    long countByStatus(BorrowingRecord.BorrowingStatus status);

    @Query("SELECT COUNT(r) FROM BorrowingRecord r WHERE r.status = 'BORROWED' AND r.dueDate < :today")
    long countOverdue(LocalDate today);

    @Query("SELECT COUNT(DISTINCT r.member) FROM BorrowingRecord r WHERE r.status = 'BORROWED'")
    long countActiveMembers();

    @Query("SELECT COALESCE(SUM(r.fineAmount), 0) FROM BorrowingRecord r WHERE r.status = 'RETURNED' AND r.fineAmount > 0")
    BigDecimal sumFinesCollected();
}
