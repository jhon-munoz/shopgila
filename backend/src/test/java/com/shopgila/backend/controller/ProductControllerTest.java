package com.shopgila.backend.controller;

import com.shopgila.backend.common.CommonControllerTest;
import com.shopgila.backend.dto.PageResponse;
import com.shopgila.backend.dto.ProductDto;
import com.shopgila.backend.dto.ProductSearchCriteria;
import com.shopgila.backend.exception.ShopgilaApiException;
import com.shopgila.backend.service.ProductService;
import jakarta.persistence.EntityNotFoundException;
import org.hamcrest.Matcher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static com.shopgila.backend.builder.ProductDtoBuilder.productDtoWith;
import static com.shopgila.backend.builder.ProductDtoBuilder.validProductDto;
import static com.shopgila.backend.constants.Route.PRODUCTS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
class ProductControllerTest extends CommonControllerTest {

    private static final UUID ID = UUID.randomUUID();
    private static final String PRODUCT_ROUTE = PRODUCTS + "/" + ID;

    @MockitoBean
    private ProductService productService;

    @Test
    @DisplayName("Should return a page of products for a search")
    void shouldSearchProducts() throws Exception {
        when(productService.search(any(), any())).thenReturn(
                new PageResponse<>(List.of(validProductDto()), 0, 20, 1, 1));
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("q", "shoes");
        params.add("category", "Footwear");
        params.add("minPrice", "10");
        params.add("inStockOnly", "true");

        sendGetRequestWithQueryParams(PRODUCTS, params)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sku").value("RS-001"))
                .andExpect(jsonPath("$.totalElements").value(1));

        ArgumentCaptor<ProductSearchCriteria> criteria = ArgumentCaptor.forClass(ProductSearchCriteria.class);
        verify(productService).search(criteria.capture(), any(Pageable.class));
        assertThat(criteria.getValue()).isEqualTo(
                new ProductSearchCriteria("shoes", "Footwear", BigDecimal.TEN, null, true));
    }

    @Test
    @DisplayName("Should search without any filter")
    void shouldSearchWithoutFilters() throws Exception {
        when(productService.search(any(), any())).thenReturn(new PageResponse<>(List.of(), 0, 20, 0, 0));

        sendSimpleGetRequest(PRODUCTS).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should return the categories")
    void shouldReturnCategories() throws Exception {
        when(productService.getCategories()).thenReturn(List.of("Books", "Footwear"));

        sendSimpleGetRequest(PRODUCTS + "/categories")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[1]").value("Footwear"));
    }

    @Test
    @DisplayName("Should return a product by id")
    void shouldReturnProductById() throws Exception {
        when(productService.get(ID)).thenReturn(validProductDto());

        sendSimpleGetRequest(PRODUCT_ROUTE)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Running Shoes"));
    }

    @Test
    @DisplayName("Should return 404 when the product does not exist")
    void shouldReturnNotFound() throws Exception {
        when(productService.get(ID)).thenThrow(new EntityNotFoundException("Product not found: " + ID));

        sendSimpleGetRequest(PRODUCT_ROUTE)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message").value("Product not found: " + ID));
    }

    @Test
    @DisplayName("Should return 400 when the id is not a UUID")
    void shouldReturnBadRequestForInvalidId() throws Exception {
        sendSimpleGetRequest(PRODUCTS + "/not-a-uuid")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("productId")));
    }

    @Test
    @DisplayName("Should create a product and return 201 with its location")
    void shouldCreateProduct() throws Exception {
        ProductDto created = ProductDto.builder().id(ID).sku("RS-001").name("Running Shoes")
                .category("Footwear").price(new BigDecimal("89.99")).stock(150).build();
        when(productService.create(any())).thenReturn(created);

        sendPostRequestWithBody(PRODUCTS, validProductDto())
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", PRODUCT_ROUTE))
                .andExpect(jsonPath("$.id").value(ID.toString()));
    }

    @Test
    @DisplayName("Should return 400 with the invalid fields when the payload is not valid")
    void shouldRejectInvalidPayload() throws Exception {
        ProductDto invalid = productDtoWith("", "", "Footwear", new BigDecimal("-1"), -1);

        sendPostRequestWithBody(PRODUCTS, invalid)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details", containsInAnyOrderStrings(
                        "name: must not be blank", "sku: must not be blank",
                        "price: must be greater than or equal to 0.00", "stock: must be greater than or equal to 0")));
    }

    @Test
    @DisplayName("Should return 400 when the body is not a valid JSON")
    void shouldRejectMalformedBody() throws Exception {
        mockMvc.perform(post(PRODUCTS)
                        .contentType(APPLICATION_JSON)
                        .content("{not-json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 409 when the SKU already exists")
    void shouldReturnConflictForDuplicatedSku() throws Exception {
        when(productService.create(any()))
                .thenThrow(new ShopgilaApiException(HttpStatus.CONFLICT, "SKU already exists: RS-001"));

        sendPostRequestWithBody(PRODUCTS, validProductDto())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("SKU already exists: RS-001"));
    }

    @Test
    @DisplayName("Should update a product")
    void shouldUpdateProduct() throws Exception {
        when(productService.update(any(UUID.class), any())).thenReturn(validProductDto());

        sendPutRequestWithBody(PRODUCT_ROUTE, validProductDto())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sku").value("RS-001"));
    }

    @Test
    @DisplayName("Should return 404 when updating a product that does not exist")
    void shouldReturnNotFoundOnUpdate() throws Exception {
        when(productService.update(any(UUID.class), any())).thenThrow(new EntityNotFoundException("missing"));

        sendPutRequestWithBody(PRODUCT_ROUTE, validProductDto()).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should delete a product and return 204")
    void shouldDeleteProduct() throws Exception {
        sendSimpleDeleteRequest(PRODUCT_ROUTE).andExpect(status().isNoContent());

        verify(productService).remove(ID);
    }

    @Test
    @DisplayName("Should return 404 when deleting a product that does not exist")
    void shouldReturnNotFoundOnDelete() throws Exception {
        doThrow(new EntityNotFoundException("missing")).when(productService).remove(ID);

        sendSimpleDeleteRequest(PRODUCT_ROUTE).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should hide internal details when an unexpected error happens")
    void shouldNotLeakInternalErrors() throws Exception {
        when(productService.get(ID)).thenThrow(new IllegalStateException("jdbc:postgresql://secret-host"));

        sendSimpleGetRequest(PRODUCT_ROUTE)
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"));
    }

    private static Matcher<Iterable<? extends String>> containsInAnyOrderStrings(String... items) {
        return containsInAnyOrder(items);
    }
}
