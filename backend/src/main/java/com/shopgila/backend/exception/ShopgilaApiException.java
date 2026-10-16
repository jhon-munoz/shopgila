package com.shopgila.backend.exception;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@EqualsAndHashCode(callSuper = false)
public class ShopgilaApiException extends RuntimeException {

    private final HttpStatus statusCode;

    public ShopgilaApiException(final String message) {
        this(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }

    public ShopgilaApiException(final HttpStatus statusCode, final String message) {
        super(message);
        this.statusCode = statusCode;
    }
}
