package com.example.library.repository;

import com.example.library.model.Book;
import org.springframework.data.jpa.domain.Specification;

public class BookSpecification {

    public static Specification<Book> isActive() {
        return (root, query, cb) -> cb.equal(root.get("active"), true);
    }

    public static Specification<Book> hasTitle(String title) {
        return (root, query, cb) -> title == null || title.isEmpty() ? null : 
                cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%");
    }

    public static Specification<Book> hasAuthor(String author) {
        return (root, query, cb) -> author == null || author.isEmpty() ? null : 
                cb.like(cb.lower(root.get("author")), "%" + author.toLowerCase() + "%");
    }

    public static Specification<Book> hasGenre(String genre) {
        return (root, query, cb) -> genre == null || genre.isEmpty() ? null : 
                cb.equal(cb.lower(root.get("genre")), genre.toLowerCase());
    }

    public static Specification<Book> isAvailable(Boolean available) {
        return (root, query, cb) -> {
            if (available == null) return null;
            if (available) {
                return cb.greaterThan(root.get("availableCopies"), 0);
            } else {
                return cb.equal(root.get("availableCopies"), 0);
            }
        };
    }
}