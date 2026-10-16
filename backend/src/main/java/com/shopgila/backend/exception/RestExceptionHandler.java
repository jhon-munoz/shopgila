package com.shopgila.backend.exception;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.List;

import static com.shopgila.backend.constants.GeneralConstants.CONCURRENT_MODIFICATION;
import static com.shopgila.backend.constants.GeneralConstants.FILE_TOO_LARGE;
import static com.shopgila.backend.constants.GeneralConstants.INTERNAL_ERROR;
import static com.shopgila.backend.constants.GeneralConstants.INVALID_PARAMETER;
import static com.shopgila.backend.constants.GeneralConstants.VALIDATION_FAILED;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.CONTENT_TOO_LARGE;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
@Slf4j
public class RestExceptionHandler {

    private static final String ERROR = "Error:";

    @ExceptionHandler({HttpMediaTypeNotSupportedException.class, HttpMessageNotReadableException.class,
            IllegalArgumentException.class, ClientInvalidRequestException.class})
    public ResponseEntity<ErrorMessage> handleBadRequest(final Exception exception, WebRequest request) {
        return build(BAD_REQUEST.value(), exception.getMessage(), request, null);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorMessage> handleNotFound(final EntityNotFoundException exception, WebRequest request) {
        return build(NOT_FOUND.value(), exception.getMessage(), request, null);
    }

    @ExceptionHandler(ShopgilaApiException.class)
    public ResponseEntity<ErrorMessage> handleApiException(final ShopgilaApiException exception, WebRequest request) {
        return build(exception.getStatusCode().value(), exception.getMessage(), request, null);
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<ErrorMessage> handleValidation(final BindException exception, WebRequest request) {
        List<String> details = exception.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .toList();
        return build(BAD_REQUEST.value(), VALIDATION_FAILED, request, details);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorMessage> handleFileTooLarge(final MaxUploadSizeExceededException exception, WebRequest request) {
        return build(CONTENT_TOO_LARGE.value(), FILE_TOO_LARGE, request, null);
    }

    @ExceptionHandler({OptimisticLockingFailureException.class, DataIntegrityViolationException.class})
    public ResponseEntity<ErrorMessage> handleConflict(final Exception exception, WebRequest request) {
        log.error(ERROR, exception);
        return build(CONFLICT.value(), CONCURRENT_MODIFICATION, request, null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorMessage> handleTypeMismatch(final MethodArgumentTypeMismatchException exception, WebRequest request) {
        return build(BAD_REQUEST.value(), INVALID_PARAMETER + exception.getName(), request, null);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorMessage> handleUnexpected(final RuntimeException exception, WebRequest request) {
        log.error(ERROR, exception);
        return build(INTERNAL_SERVER_ERROR.value(), INTERNAL_ERROR, request, null);
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }

    private ResponseEntity<ErrorMessage> build(int status, String message, WebRequest request, List<String> details) {
        ErrorMessage body = ErrorMessage.builder()
                .statusCode(status)
                .timestamp(LocalDateTime.now())
                .message(message)
                .description(request.getDescription(false))
                .details(details)
                .build();
        return ResponseEntity.status(status).body(body);
    }
}
