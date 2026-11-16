package com.example.library.exception;

public class BookInUseException extends RuntimeException {
    public BookInUseException(String message) {
        super(message);
    }
}
