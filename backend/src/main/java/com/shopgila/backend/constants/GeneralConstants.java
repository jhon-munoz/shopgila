package com.shopgila.backend.constants;

import lombok.NoArgsConstructor;

import static lombok.AccessLevel.PRIVATE;

@NoArgsConstructor(access = PRIVATE)
public class GeneralConstants {
    public static final String PRODUCT_NOT_FOUND = "Product not found: ";
    public static final String ORDER_NOT_FOUND = "Order not found: ";
    public static final String INSUFFICIENT_STOCK = "Insufficient stock: ";
    public static final String PAYMENT_DECLINED = "Payment declined: ";
    public static final String SKU_ALREADY_EXISTS = "SKU already exists: ";
    public static final String EMPTY_FILE = "The uploaded file is empty";
    public static final String FILE_TOO_LARGE = "Uploaded file is too large";
    public static final String CSV_MISSING_COLUMNS = "CSV is missing required columns: ";
    public static final String CSV_UNREADABLE = "Unable to read the CSV file: ";
    public static final String INVALID_NUMBER = "%s is not a valid number: '%s'";
    public static final String INVALID_INTEGER = "%s is not a valid integer: '%s'";
    public static final String CONCURRENT_MODIFICATION =
            "The resource was modified concurrently or violates a constraint, please retry";
    public static final String VALIDATION_FAILED = "Validation failed";
    public static final String INTERNAL_ERROR = "An unexpected error occurred";
    public static final String INVALID_PARAMETER = "Invalid value for parameter: ";
}
