package com.example.library.repository;

import com.example.library.model.BorrowingRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BorrowingRecordRepository extends JpaRepository<BorrowingRecord, Long> {
    Page<BorrowingRecord> findByMemberId(Long memberId, Pageable pageable);
    List<BorrowingRecord> findByBookId(Long bookId);
    long countByMemberIdAndStatus(Long memberId, BorrowingRecord.BorrowingStatus status);
}
