package com.shopgila.backend.controller;

import com.shopgila.backend.common.CommonIntegrationTests;
import com.shopgila.backend.dto.ProductDto;
import com.shopgila.backend.model.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static com.shopgila.backend.builder.ProductBuilder.productWith;
import static com.shopgila.backend.builder.ProductDtoBuilder.productDtoWith;
import static com.shopgila.backend.constants.Route.PRODUCTS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductControllerIntTest extends CommonIntegrationTests {

    @Test
    @DisplayName("Save a new product in the system")
    void givenNewProductThenSaveIt() throws Exception {
        //Arrange
        ProductDto request = productDtoWith(" rs-001 ", "Running Shoes", "Footwear", "89.99", 150);

        //Act
        String body = sendPostRequestWithBody(PRODUCTS, request)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value("RS-001"))
                .andReturn().getResponse().getContentAsString();

        //Assert
        List<Product> products = productRepository.findAll();
        assertThat(products).hasSize(1);
        Product saved = products.get(0);
        assertThat(saved.getSku()).isEqualTo("RS-001");
        assertThat(saved.getName()).isEqualTo("Running Shoes");
        assertThat(saved.getPrice()).isEqualByComparingTo("89.99");
        assertThat(saved.getStock()).isEqualTo(150);
        assertThat(saved.getWeightKg()).isNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getVersion()).isZero();
        assertThat(objectMapper.readValue(body, ProductDto.class).id()).isEqualTo(saved.getId());
    }

    @Test
    @DisplayName("Return the location of the created product")
    void givenNewProductThenReturnLocation() throws Exception {
        sendPostRequestWithBody(PRODUCTS, productDtoWith("RS-001", "Shoes", "Footwear", "10.00", 1))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString(PRODUCTS + "/")));
    }

    @Test
    @DisplayName("Ignore the id and audit fields sent by the client")
    void givenClientProvidedIdThenIgnoreIt() throws Exception {
        UUID clientId = UUID.randomUUID();
        ProductDto request = ProductDto.builder().id(clientId).sku("RS-001").name("Shoes").category("Footwear")
                .price(BigDecimal.TEN).stock(1).build();

        sendPostRequestWithBody(PRODUCTS, request).andExpect(status().isCreated());

        assertThat(productRepository.findById(clientId)).isEmpty();
        assertThat(productRepository.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("Reject a product whose SKU already exists regardless of the case")
    void givenDuplicatedSkuThenReturnConflict() throws Exception {
        productRepository.saveAndFlush(productWith("RS-001", "Shoes", "Footwear", "10.00", 1));

        sendPostRequestWithBody(PRODUCTS, productDtoWith("rs-001", "Other", "Footwear", "20.00", 2))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("SKU already exists: RS-001"));

        assertThat(productRepository.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("Reject an invalid product with the list of invalid fields")
    void givenInvalidProductThenReturnBadRequest() throws Exception {
        ProductDto invalid = productDtoWith("", "", "Footwear", "-1.00", -1);

        sendPostRequestWithBody(PRODUCTS, invalid)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.length()").value(4));

        assertThat(productRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("Retrieve a product by id")
    void givenExistingProductThenRetrieveIt() throws Exception {
        Product saved = productRepository.saveAndFlush(productWith("RS-001", "Shoes", "Footwear", "10.00", 1));

        sendSimpleGetRequest(PRODUCTS + "/" + saved.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId().toString()))
                .andExpect(jsonPath("$.sku").value("RS-001"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    @DisplayName("Return 404 when retrieving an unknown product")
    void givenUnknownProductThenReturnNotFound() throws Exception {
        UUID unknown = UUID.randomUUID();

        sendSimpleGetRequest(PRODUCTS + "/" + unknown)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Product not found: " + unknown));
    }

    @Test
    @DisplayName("Update an existing product")
    void givenExistingProductThenUpdateIt() throws Exception {
        Product saved = productRepository.saveAndFlush(productWith("RS-001", "Shoes", "Footwear", "10.00", 1));

        sendPutRequestWithBody(PRODUCTS + "/" + saved.getId(),
                productDtoWith("rs-001", "Trail Shoes", "Sports", "55.50", 7))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Trail Shoes"));

        Product updated = productRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Trail Shoes");
        assertThat(updated.getCategory()).isEqualTo("Sports");
        assertThat(updated.getPrice()).isEqualByComparingTo("55.50");
        assertThat(updated.getStock()).isEqualTo(7);
        assertThat(updated.getVersion()).isEqualTo(1);
        assertThat(updated.getUpdatedAt()).isAfter(updated.getCreatedAt());
        assertThat(productRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Reject updating a product to a SKU used by another product")
    void givenSkuOfAnotherProductThenReturnConflictOnUpdate() throws Exception {
        productRepository.saveAndFlush(productWith("RS-001", "Shoes", "Footwear", "10.00", 1));
        Product other = productRepository.saveAndFlush(productWith("WM-042", "Mouse", "Electronics", "20.00", 2));

        sendPutRequestWithBody(PRODUCTS + "/" + other.getId(),
                productDtoWith("RS-001", "Mouse", "Electronics", "20.00", 2))
                .andExpect(status().isConflict());

        assertThat(productRepository.findById(other.getId()).orElseThrow().getSku()).isEqualTo("WM-042");
    }

    @Test
    @DisplayName("Return 404 when updating an unknown product")
    void givenUnknownProductThenReturnNotFoundOnUpdate() throws Exception {
        sendPutRequestWithBody(PRODUCTS + "/" + UUID.randomUUID(),
                productDtoWith("RS-001", "Shoes", "Footwear", "10.00", 1))
                .andExpect(status().isNotFound());

        assertThat(productRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("Delete an existing product")
    void givenExistingProductThenDeleteIt() throws Exception {
        Product saved = productRepository.saveAndFlush(productWith("RS-001", "Shoes", "Footwear", "10.00", 1));

        sendSimpleDeleteRequest(PRODUCTS + "/" + saved.getId()).andExpect(status().isNoContent());

        assertThat(productRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("Return 404 when deleting an unknown product")
    void givenUnknownProductThenReturnNotFoundOnDelete() throws Exception {
        sendSimpleDeleteRequest(PRODUCTS + "/" + UUID.randomUUID()).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Return the distinct categories sorted alphabetically")
    void givenProductsThenReturnDistinctCategories() throws Exception {
        productRepository.saveAndFlush(productWith("A-1", "A", "Sports", "1.00", 1));
        productRepository.saveAndFlush(productWith("A-2", "B", "Books", "1.00", 1));
        productRepository.saveAndFlush(productWith("A-3", "C", "Sports", "1.00", 1));

        sendSimpleGetRequest(PRODUCTS + "/categories")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0]").value("Books"))
                .andExpect(jsonPath("$[1]").value("Sports"));
    }
}
