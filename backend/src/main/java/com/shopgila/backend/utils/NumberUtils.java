package com.shopgila.backend.utils;

import com.shopgila.backend.exception.ClientInvalidRequestException;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import static com.shopgila.backend.constants.GeneralConstants.INVALID_INTEGER;
import static com.shopgila.backend.constants.GeneralConstants.INVALID_NUMBER;
import static lombok.AccessLevel.PRIVATE;

@NoArgsConstructor(access = PRIVATE)
public class NumberUtils {

    public static String stripCurrency(String raw) {
        return raw == null ? null : raw.replace("$", "").replace(",", "").trim();
    }

    public static BigDecimal parseDecimal(String raw, String field) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(raw.trim());
        } catch (NumberFormatException e) {
            throw new ClientInvalidRequestException(String.format(INVALID_NUMBER, field, raw));
        }
    }

    public static Integer parseInteger(String raw, String field) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(raw.trim());
        } catch (NumberFormatException e) {
            throw new ClientInvalidRequestException(String.format(INVALID_INTEGER, field, raw));
        }
    }
}
