package com.shopgila.backend.utils;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.StringReader;

import static org.assertj.core.api.Assertions.assertThat;

class CsvUtilsTest {

    private CSVRecord firstRecord(String content) throws IOException {
        return CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).get()
                .parse(new StringReader(content)).getRecords().get(0);
    }

    @Test
    @DisplayName("Should return the trimmed value of a column")
    void shouldReturnTrimmedValue() throws IOException {
        CSVRecord record = firstRecord("name,sku\n  Shoes ,RS-001\n");

        assertThat(CsvUtils.value(record, "name")).isEqualTo("Shoes");
    }

    @Test
    @DisplayName("Should return an empty string for an unknown column")
    void shouldReturnEmptyForUnknownColumn() throws IOException {
        CSVRecord record = firstRecord("name,sku\nShoes,RS-001\n");

        assertThat(CsvUtils.value(record, "price")).isEmpty();
    }

    @Test
    @DisplayName("Should return an empty string when the row is shorter than the header")
    void shouldReturnEmptyForMissingTrailingValue() throws IOException {
        CSVRecord record = firstRecord("name,sku\nShoes\n");

        assertThat(CsvUtils.value(record, "sku")).isEmpty();
    }

    @Test
    @DisplayName("Should detect a row with only blank fields")
    void shouldDetectBlankRecord() throws IOException {
        assertThat(CsvUtils.isBlank(firstRecord("name,sku\n , \n"))).isTrue();
        assertThat(CsvUtils.isBlank(firstRecord("name,sku\nShoes,\n"))).isFalse();
    }
}
