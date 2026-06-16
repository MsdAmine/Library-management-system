package com.example.library.exception;

public class BorrowingLimitExceededException extends RuntimeException {
    public BorrowingLimitExceededException(String message) {
        super(message);
    }
}
