package com.example.library.exception;

// We extend RuntimeException so we don't have to add "throws" to every method signature
public class ResourceAlreadyExistsException extends RuntimeException {
    public ResourceAlreadyExistsException(String message) {
        super(message);
    }
}