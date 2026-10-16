package com.shopgila.backend.exception;

public class ClientInvalidRequestException extends RuntimeException {

    public ClientInvalidRequestException(String message) {
        super(message);
    }
}
