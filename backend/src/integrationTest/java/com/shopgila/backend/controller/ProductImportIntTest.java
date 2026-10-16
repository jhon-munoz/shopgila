package com.shopgila.backend.controller;

import com.shopgila.backend.common.CommonIntegrationTests;
import com.shopgila.backend.model.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static com.shopgila.backend.builder.ProductBuilder.productWith;
import static com.shopgila.backend.constants.Route.PRODUCT_IMPORT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductImportIntTest extends CommonIntegrationTests {

    private static final String HEADER = "name,sku,description,category,price,stock,weight_kg\n";

    private byte[] challengeCsv() throws IOException {
        return new ClassPathResource("payload/products.csv").getContentAsByteArray();
    }

    private byte[] csv(String rows) {
        return (HEADER + rows).getBytes(StandardCharsets.UTF_8);
    }

    @Test
    @DisplayName("Import the challenge CSV reporting the invalid rows")
    void givenChallengeCsvThenImportValidRowsAndReportTheRest() throws Exception {
        sendFile(PRODUCT_IMPORT, challengeCsv())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRows").value(95))
                .andExpect(jsonPath("$.created").value(87))
                .andExpect(jsonPath("$.updated").value(0))
                .andExpect(jsonPath("$.failed").value(5))
                .andExpect(jsonPath("$.blankRows").value(2))
                .andExpect(jsonPath("$.duplicatesInFile").value(3))
                .andExpect(jsonPath("$.errors[?(@.sku == 'YM-015')].message", hasItem(containsString("price"))))
                .andExpect(jsonPath("$.errors[?(@.sku == 'DL-007')].message", hasItem(containsString("stock"))))
                .andExpect(jsonPath("$.errors[?(@.sku == 'HD-099')].message", hasItem(containsString("name"))))
                .andExpect(jsonPath("$.errors[?(@.sku == 'WS-001')].message", hasItem(containsString("name"))))
                .andExpect(jsonPath("$.errors[?(@.sku == 'GC-025')].message", hasItem(containsString("category"))));

        assertThat(productRepository.count()).isEqualTo(87);
    }

    @Test
    @DisplayName("Import the price with a currency symbol and keep an empty weight as null")
    void givenDirtyValuesThenCleanThem() throws Exception {
        sendFile(PRODUCT_IMPORT, challengeCsv()).andExpect(status().isOk());

        Product mouse = productRepository.findAllBySkuIn(List.of("WM-042")).get(0);
        assertThat(mouse.getPrice()).isEqualByComparingTo("29.99");
        Product withoutWeight = productRepository.findAllBySkuIn(List.of("GK-088")).get(0);
        assertThat(withoutWeight.getWeightKg()).isNull();
    }

    @Test
    @DisplayName("Be idempotent when the same file is imported twice")
    void givenSameFileTwiceThenUpdateInsteadOfDuplicate() throws Exception {
        sendFile(PRODUCT_IMPORT, challengeCsv()).andExpect(status().isOk());

        sendFile(PRODUCT_IMPORT, challengeCsv())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created").value(0))
                .andExpect(jsonPath("$.updated").value(87));

        assertThat(productRepository.count()).isEqualTo(87);
    }

    @Test
    @DisplayName("Update an existing product keeping its identity")
    void givenExistingSkuThenUpdateIt() throws Exception {
        Product existing = productRepository.saveAndFlush(productWith("RS-001", "Old name", "Footwear", "1.00", 1));
        UUID originalId = existing.getId();

        sendFile(PRODUCT_IMPORT, csv("Running Shoes,rs-001,Light shoes,Footwear,89.99,150,0.35\n"))
                .andExpect(jsonPath("$.created").value(0))
                .andExpect(jsonPath("$.updated").value(1));

        Product updated = productRepository.findById(originalId).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Running Shoes");
        assertThat(updated.getPrice()).isEqualByComparingTo("89.99");
        assertThat(updated.getStock()).isEqualTo(150);
        assertThat(updated.getWeightKg()).isEqualByComparingTo("0.35");
        assertThat(productRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Keep the last row when a SKU is repeated in the file")
    void givenRepeatedSkuThenKeepLastRow() throws Exception {
        sendFile(PRODUCT_IMPORT, csv("""
                First,BS-021,Desc,Books,10.00,1,
                Second,BS-021,Desc,Books,20.00,2,
                """))
                .andExpect(jsonPath("$.created").value(1))
                .andExpect(jsonPath("$.duplicatesInFile").value(1));

        Product saved = productRepository.findAll().get(0);
        assertThat(saved.getName()).isEqualTo("Second");
        assertThat(saved.getPrice()).isEqualByComparingTo("20.00");
    }

    @Test
    @DisplayName("Import the valid rows even when other rows fail")
    void givenMixedRowsThenImportOnlyValidOnes() throws Exception {
        sendFile(PRODUCT_IMPORT, csv("""
                Shoes,RS-001,Desc,Footwear,10.00,1,
                Mat,YM-015,Desc,Sports,free,1,
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created").value(1))
                .andExpect(jsonPath("$.failed").value(1))
                .andExpect(jsonPath("$.errors[0].line").value(3))
                .andExpect(jsonPath("$.errors[0].sku").value("YM-015"));

        assertThat(productRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Accept a CSV starting with a UTF-8 BOM")
    void givenCsvWithBomThenImportIt() throws Exception {
        byte[] content = ("﻿" + HEADER + "Shoes,RS-001,Desc,Footwear,10.00,1,\n").getBytes(StandardCharsets.UTF_8);

        sendFile(PRODUCT_IMPORT, content)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created").value(1));
    }

    @Test
    @DisplayName("Reject a CSV with missing columns without importing anything")
    void givenMissingColumnsThenReturnBadRequest() throws Exception {
        sendFile(PRODUCT_IMPORT, "name,sku\nShoes,RS-001\n".getBytes(StandardCharsets.UTF_8))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("category")));

        assertThat(productRepository.count()).isZero();
    }

    @Test
    @DisplayName("Reject an empty file")
    void givenEmptyFileThenReturnBadRequest() throws Exception {
        sendFile(PRODUCT_IMPORT, new byte[0])
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("The uploaded file is empty"));
    }
}
