package com.example.library.exception;

public class OutstandingFineException extends RuntimeException {
    public OutstandingFineException(String message) {
        super(message);
    }
}
