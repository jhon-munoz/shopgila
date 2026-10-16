package com.shopgila.backend.utils;

import com.shopgila.backend.exception.ClientInvalidRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class NumberUtilsTest {

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {"$29.99|29.99", "'1,299.50'|1299.50", " 5.00 |5.00", "10|10"})
    @DisplayName("Should strip currency symbols and thousand separators")
    void shouldStripCurrency(String raw, String expected) {
        assertThat(NumberUtils.stripCurrency(raw)).isEqualTo(expected);
    }

    @Test
    @DisplayName("Should return null when stripping a null value")
    void shouldReturnNullWhenStrippingNull() {
        assertThat(NumberUtils.stripCurrency(null)).isNull();
    }

    @Test
    @DisplayName("Should parse a decimal")
    void shouldParseDecimal() {
        assertThat(NumberUtils.parseDecimal(" 0.35 ", "weight_kg")).isEqualByComparingTo(new BigDecimal("0.35"));
    }

    @Test
    @DisplayName("Should return null for blank decimals")
    void shouldReturnNullForBlankDecimal() {
        assertThat(NumberUtils.parseDecimal("  ", "weight_kg")).isNull();
        assertThat(NumberUtils.parseDecimal(null, "weight_kg")).isNull();
    }

    @Test
    @DisplayName("Should fail with a descriptive message for an invalid decimal")
    void shouldFailForInvalidDecimal() {
        assertThatThrownBy(() -> NumberUtils.parseDecimal("free", "price"))
                .isInstanceOf(ClientInvalidRequestException.class)
                .hasMessage("price is not a valid number: 'free'");
    }

    @Test
    @DisplayName("Should parse an integer")
    void shouldParseInteger() {
        assertThat(NumberUtils.parseInteger(" 150 ", "stock")).isEqualTo(150);
    }

    @Test
    @DisplayName("Should return null for blank integers")
    void shouldReturnNullForBlankInteger() {
        assertThat(NumberUtils.parseInteger("", "stock")).isNull();
    }

    @Test
    @DisplayName("Should fail with a descriptive message for an invalid integer")
    void shouldFailForInvalidInteger() {
        assertThatThrownBy(() -> NumberUtils.parseInteger("12.5", "stock"))
                .isInstanceOf(ClientInvalidRequestException.class)
                .hasMessage("stock is not a valid integer: '12.5'");
    }
}
