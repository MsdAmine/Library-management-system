package com.example.library.repository;

import com.example.library.model.Fine;
import com.example.library.model.FineStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {

    List<Fine> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    List<Fine> findByMemberIdAndStatusOrderByCreatedAtDesc(Long memberId, FineStatus status);

    Optional<Fine> findByBorrowingRecordId(Long borrowingRecordId);

    List<Fine> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fine f WHERE f.member.id = :memberId AND f.status = :status")
    BigDecimal sumAmountByMemberIdAndStatus(@Param("memberId") Long memberId, @Param("status") FineStatus status);

    long countByMemberIdAndStatus(Long memberId, FineStatus status);
}
