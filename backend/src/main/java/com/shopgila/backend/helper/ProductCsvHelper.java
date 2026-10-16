package com.shopgila.backend.helper;

import com.shopgila.backend.dto.ProductDto;
import com.shopgila.backend.exception.ClientInvalidRequestException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.io.input.BOMInputStream;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import static com.shopgila.backend.constants.GeneralConstants.CSV_MISSING_COLUMNS;
import static com.shopgila.backend.constants.GeneralConstants.CSV_UNREADABLE;
import static com.shopgila.backend.utils.CsvUtils.isBlank;
import static com.shopgila.backend.utils.CsvUtils.value;
import static com.shopgila.backend.utils.NumberUtils.parseDecimal;
import static com.shopgila.backend.utils.NumberUtils.parseInteger;
import static com.shopgila.backend.utils.NumberUtils.stripCurrency;

@Component
@RequiredArgsConstructor
public class ProductCsvHelper {

    private static final List<String> REQUIRED_COLUMNS =
            List.of("name", "sku", "description", "category", "price", "stock", "weight_kg");

    private static final CSVFormat FORMAT = CSVFormat.DEFAULT.builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreEmptyLines(true)
            .setIgnoreSurroundingSpaces(true)
            .setIgnoreHeaderCase(true)
            .setAllowMissingColumnNames(true)
            .get();

    private final Validator validator;

    public CsvParseResult parse(InputStream input) {
        List<ParsedRow> rows = new ArrayList<>();
        int blankRows = 0;
        try (Reader reader = new InputStreamReader(BOMInputStream.builder().setInputStream(input).get(), StandardCharsets.UTF_8);
             CSVParser parser = FORMAT.parse(reader)) {
            assertRequiredColumns(parser.getHeaderNames());
            for (CSVRecord record : parser) {
                if (isBlank(record)) {
                    blankRows++;
                } else {
                    rows.add(toRow(record));
                }
            }
        } catch (IOException | UncheckedIOException e) {
            throw new ClientInvalidRequestException(CSV_UNREADABLE + e.getMessage());
        }
        return new CsvParseResult(rows, blankRows);
    }

    private void assertRequiredColumns(List<String> headers) {
        List<String> normalized = headers.stream().map(header -> header.trim().toLowerCase()).toList();
        List<String> missing = REQUIRED_COLUMNS.stream().filter(column -> !normalized.contains(column)).toList();
        if (!missing.isEmpty()) {
            throw new ClientInvalidRequestException(CSV_MISSING_COLUMNS + String.join(", ", missing));
        }
    }

    private ParsedRow toRow(CSVRecord record) {
        long line = record.getRecordNumber() + 1;
        String sku = value(record, "sku");
        try {
            ProductDto product = toDto(record);
            String violations = validate(product);
            return violations.isEmpty() ? ParsedRow.valid(line, sku, product) : ParsedRow.invalid(line, sku, violations);
        } catch (ClientInvalidRequestException e) {
            return ParsedRow.invalid(line, sku, e.getMessage());
        }
    }

    private ProductDto toDto(CSVRecord record) {
        BigDecimal price = parseDecimal(stripCurrency(value(record, "price")), "price");
        BigDecimal weightKg = parseDecimal(value(record, "weight_kg"), "weight_kg");
        String description = value(record, "description");
        return ProductDto.builder()
                .name(value(record, "name"))
                .sku(value(record, "sku"))
                .description(description.isEmpty() ? null : description)
                .category(value(record, "category"))
                .price(price == null ? null : price.setScale(2, RoundingMode.HALF_UP))
                .stock(parseInteger(value(record, "stock"), "stock"))
                .weightKg(weightKg == null ? null : weightKg.setScale(3, RoundingMode.HALF_UP))
                .build();
    }

    private String validate(ProductDto product) {
        return validator.validate(product).stream()
                .sorted(Comparator.comparing(violation -> violation.getPropertyPath().toString()))
                .map(this::formatViolation)
                .collect(Collectors.joining("; "));
    }

    private String formatViolation(ConstraintViolation<ProductDto> violation) {
        return violation.getPropertyPath() + ": " + violation.getMessage();
    }

    public record CsvParseResult(List<ParsedRow> rows, int blankRows) {
    }

    public record ParsedRow(long line, String sku, ProductDto product, String error) {

        static ParsedRow valid(long line, String sku, ProductDto product) {
            return new ParsedRow(line, sku, product, null);
        }

        static ParsedRow invalid(long line, String sku, String error) {
            return new ParsedRow(line, sku, null, error);
        }

        public boolean isValid() {
            return error == null;
        }
    }
}
