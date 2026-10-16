package com.shopgila.backend.helper;

import com.shopgila.backend.exception.ClientInvalidRequestException;
import com.shopgila.backend.helper.ProductCsvHelper.CsvParseResult;
import com.shopgila.backend.helper.ProductCsvHelper.ParsedRow;
import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductCsvHelperTest {

    private static final String HEADER = "name,sku,description,category,price,stock,weight_kg\n";

    private static ValidatorFactory validatorFactory;
    private static ProductCsvHelper helper;

    @BeforeAll
    static void setUp() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        helper = new ProductCsvHelper(validatorFactory.getValidator());
    }

    @AfterAll
    static void tearDown() {
        validatorFactory.close();
    }

    private InputStream csv(String content) {
        return new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("Should parse a valid row")
    void shouldParseValidRow() {
        CsvParseResult result = helper.parse(csv(HEADER + "Running Shoes,RS-001,Light shoes,Footwear,89.99,150,0.35\n"));

        assertThat(result.rows()).hasSize(1);
        ParsedRow row = result.rows().get(0);
        assertThat(row.isValid()).isTrue();
        assertThat(row.line()).isEqualTo(2);
        assertThat(row.product().name()).isEqualTo("Running Shoes");
        assertThat(row.product().sku()).isEqualTo("RS-001");
        assertThat(row.product().price()).isEqualByComparingTo("89.99");
        assertThat(row.product().stock()).isEqualTo(150);
        assertThat(row.product().weightKg()).isEqualByComparingTo("0.35");
    }

    @Test
    @DisplayName("Should accept prices with a currency symbol")
    void shouldAcceptPriceWithCurrencySymbol() {
        CsvParseResult result = helper.parse(csv(HEADER + "Mouse,WM-042,Ergonomic,Electronics,$29.99,75,0.12\n"));

        assertThat(result.rows().get(0).product().price()).isEqualByComparingTo("29.99");
    }

    @Test
    @DisplayName("Should keep commas inside quoted fields")
    void shouldKeepCommasInsideQuotedFields() {
        CsvParseResult result = helper.parse(csv(HEADER + "Coffee,CB-010,\"Single origin, medium roast\",Food,18.75,500,1.0\n"));

        assertThat(result.rows().get(0).product().description()).isEqualTo("Single origin, medium roast");
    }

    @Test
    @DisplayName("Should accept an empty weight")
    void shouldAcceptEmptyWeight() {
        CsvParseResult result = helper.parse(csv(HEADER + "Gift Card,GK-088,Card,Gifts,25.00,10,\n"));

        assertThat(result.rows().get(0).isValid()).isTrue();
        assertThat(result.rows().get(0).product().weightKg()).isNull();
    }

    @Test
    @DisplayName("Should round price and weight to the supported scale")
    void shouldRoundToSupportedScale() {
        CsvParseResult result = helper.parse(csv(HEADER + "Item,IT-1,Desc,Misc,89.999,1,0.12345\n"));

        assertThat(result.rows().get(0).product().price()).isEqualByComparingTo("90.00");
        assertThat(result.rows().get(0).product().weightKg()).isEqualByComparingTo("0.123");
    }

    @Test
    @DisplayName("Should report a row with a non numeric price")
    void shouldReportNonNumericPrice() {
        CsvParseResult result = helper.parse(csv(HEADER + "Yoga Mat,YM-015,Mat,Sports,free,10,1.2\n"));

        ParsedRow row = result.rows().get(0);
        assertThat(row.isValid()).isFalse();
        assertThat(row.sku()).isEqualTo("YM-015");
        assertThat(row.error()).isEqualTo("price is not a valid number: 'free'");
    }

    @Test
    @DisplayName("Should report a row with negative stock")
    void shouldReportNegativeStock() {
        CsvParseResult result = helper.parse(csv(HEADER + "Lamp,DL-007,Desk lamp,Home,15.00,-5,0.5\n"));

        assertThat(result.rows().get(0).isValid()).isFalse();
        assertThat(result.rows().get(0).error()).contains("stock");
    }

    @Test
    @DisplayName("Should report a row with a blank name")
    void shouldReportBlankName() {
        CsvParseResult result = helper.parse(csv(HEADER + ",HD-099,Desc,Home,15.00,5,0.5\n"));

        assertThat(result.rows().get(0).isValid()).isFalse();
        assertThat(result.rows().get(0).error()).contains("name");
    }

    @Test
    @DisplayName("Should report a row with a blank category")
    void shouldReportBlankCategory() {
        CsvParseResult result = helper.parse(csv(HEADER + "Card,GC-025,Desc,,15.00,5,0.5\n"));

        assertThat(result.rows().get(0).isValid()).isFalse();
        assertThat(result.rows().get(0).error()).contains("category");
    }

    @Test
    @DisplayName("Should count blank rows without reporting them as errors")
    void shouldCountBlankRows() {
        CsvParseResult result = helper.parse(csv(HEADER + ",,,,,,\nShoes,S-1,Desc,Footwear,10,1,\n"));

        assertThat(result.blankRows()).isEqualTo(1);
        assertThat(result.rows()).hasSize(1);
    }

    @Test
    @DisplayName("Should fail when required columns are missing")
    void shouldFailWhenColumnsAreMissing() {
        assertThatThrownBy(() -> helper.parse(csv("name,sku\nShoes,S-1\n")))
                .isInstanceOf(ClientInvalidRequestException.class)
                .hasMessageContaining("category")
                .hasMessageContaining("price");
    }

    @Test
    @DisplayName("Should ignore the UTF-8 BOM and the header case")
    void shouldIgnoreBomAndHeaderCase() {
        String content = "﻿Name,SKU,Description,Category,Price,Stock,Weight_KG\nShoes,S-1,Desc,Footwear,10,1,\n";

        CsvParseResult result = helper.parse(csv(content));

        assertThat(result.rows()).hasSize(1);
        assertThat(result.rows().get(0).isValid()).isTrue();
    }
}
