package com.example.library.repository;

import com.example.library.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.active = true")
    Optional<User> findByEmail(@Param("email") String email);

    @Query("SELECT u WHERE u.email = :email")
    Optional<User> findAnyByEmail(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.active = true")
    Optional<User> findActiveById(@Param("id") Long id);

    @Query("SELECT u FROM User u WHERE u.active = true")
    Page<User> findAllActive(Pageable pageable);

    @Query("SELECT u FROM User u WHERE (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :firstName, '%')) OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :lastName, '%'))) AND u.active = true")
    Page<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(@Param("firstName") String firstName, @Param("lastName") String lastName, Pageable pageable);
}