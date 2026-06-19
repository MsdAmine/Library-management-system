package com.example.library.exception;

public class InventoryStateException extends RuntimeException {
    public InventoryStateException(String message) {
        super(message);
    }
}
