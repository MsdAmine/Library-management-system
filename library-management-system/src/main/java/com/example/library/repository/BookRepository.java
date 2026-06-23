package com.example.library.repository;

import com.example.library.model.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {
    
    @Query("SELECT b FROM Book b WHERE b.id = :id AND b.active = true")
    Optional<Book> findActiveById(@Param("id") Long id);

    @Query("SELECT b FROM Book b WHERE b.isbn = :isbn AND b.active = true")
    Optional<Book> findByIsbn(@Param("isbn") String isbn);

    @Query("SELECT b FROM Book b WHERE b.isbn = :isbn")
    Optional<Book> findAnyByIsbn(@Param("isbn") String isbn);

    @Query("SELECT b FROM Book b WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%')) AND b.active = true")
    List<Book> findByTitleContainingIgnoreCase(@Param("title") String title);

    @Query("SELECT b FROM Book b WHERE LOWER(b.author) LIKE LOWER(CONCAT('%', :author, '%')) AND b.active = true")
    List<Book> findByAuthorContainingIgnoreCase(@Param("author") String author);

    @Query("SELECT b FROM Book b WHERE b.active = true")
    Page<Book> findAllActive(Pageable pageable);

    @Query("SELECT COALESCE(SUM(b.totalCopies), 0) FROM Book b WHERE b.active = true")
    long sumTotalCopies();

    @Query("SELECT COALESCE(SUM(b.availableCopies), 0) FROM Book b WHERE b.active = true")
    long sumAvailableCopies();

    @Modifying
    @Query("UPDATE Book b SET b.availableCopies = b.availableCopies - 1 WHERE b.id = :id AND b.availableCopies > 0 AND b.active = true")
    int decrementAvailableCopies(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Book b SET b.availableCopies = b.availableCopies + 1 WHERE b.id = :id AND b.availableCopies < b.totalCopies AND b.active = true")
    int incrementAvailableCopies(@Param("id") Long id);
}