package com.example.library.exception;

public class BookNotEligibleForHoldException extends RuntimeException {
    public BookNotEligibleForHoldException(String message) {
        super(message);
    }
}
