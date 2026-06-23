package com.example.library.repository;

import com.example.library.model.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    @Query("SELECT m FROM Member m WHERE m.id = :id AND m.active = true")
    Optional<Member> findActiveById(@Param("id") Long id);

    @Query("SELECT m FROM Member m WHERE m.email = :email AND m.active = true")
    Optional<Member> findByEmail(@Param("email") String email);

    @Query("SELECT m FROM Member m WHERE m.email = :email")
    Optional<Member> findAnyByEmail(@Param("email") String email);

    @Query("SELECT m FROM Member m WHERE m.active = true")
    Page<Member> findAllActive(Pageable pageable);

    @Query("SELECT m FROM Member m WHERE (LOWER(m.firstName) LIKE LOWER(CONCAT('%', :firstName, '%')) OR LOWER(m.lastName) LIKE LOWER(CONCAT('%', :lastName, '%'))) AND m.active = true")
    Page<Member> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(@Param("firstName") String firstName, @Param("lastName") String lastName, Pageable pageable);
}