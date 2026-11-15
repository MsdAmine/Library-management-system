package com.example.library.service;

import com.example.library.model.Book;
import com.example.library.model.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** All circulation transitions acquire the book lock before refreshing mutable state. */
@Component
@RequiredArgsConstructor
public class InventoryLocks {
    private final EntityManager entityManager;

    public void book(Long id) {
        Book book = entityManager.find(Book.class, id);
        if (book != null) entityManager.refresh(book, LockModeType.PESSIMISTIC_WRITE);
    }

    public void member(User user) {
        entityManager.refresh(user, LockModeType.PESSIMISTIC_WRITE);
    }

    public void refresh(Object entity) {
        entityManager.refresh(entity);
    }
}
