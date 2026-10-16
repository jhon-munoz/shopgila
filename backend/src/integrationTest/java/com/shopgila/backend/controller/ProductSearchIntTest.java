package com.shopgila.backend.controller;

import com.shopgila.backend.common.CommonIntegrationTests;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import static com.shopgila.backend.builder.ProductBuilder.productWith;
import static com.shopgila.backend.constants.Route.PRODUCTS;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductSearchIntTest extends CommonIntegrationTests {

    @BeforeEach
    void seedProducts() {
        productRepository.saveAndFlush(productWith("WM-042", "Wireless Mouse", "Electronics", "29.99", 75, "Ergonomic mouse"));
        productRepository.saveAndFlush(productWith("WK-001", "Wireless Keyboard", "Electronics", "59.99", 0, "Compact keyboard"));
        productRepository.saveAndFlush(productWith("RS-001", "Running Shoes", "Footwear", "89.99", 10, "Lightweight shoes"));
        productRepository.saveAndFlush(productWith("CB-010", "Coffee Beans", "Food & Beverage", "18.75", 500, "Medium roast"));
        productRepository.saveAndFlush(productWith("YM-015", "Yoga Mat", "Sports", "24.50", 5, "Non-slip mat"));
        productRepository.saveAndFlush(productWith("GC-025", "Gift Card", "Gifts", "50.00", 99, "Save 50% today"));
    }

    private MultiValueMap<String, String> params(String... keyValues) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            params.add(keyValues[i], keyValues[i + 1]);
        }
        return params;
    }

    @Test
    @DisplayName("Return every product when no filter is given")
    void givenNoFiltersThenReturnAll() throws Exception {
        sendSimpleGetRequest(PRODUCTS)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.content[0].name").value("Coffee Beans"));
    }

    @Test
    @DisplayName("Search by text in the name ignoring the case")
    void givenTextThenSearchInName() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("q", "WIRELESS"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @DisplayName("Search by text in the SKU")
    void givenTextThenSearchInSku() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("q", "rs-0"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].sku").value("RS-001"));
    }

    @Test
    @DisplayName("Search by text in the description")
    void givenTextThenSearchInDescription() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("q", "ergonomic"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].sku").value("WM-042"));
    }

    @Test
    @DisplayName("Treat the percent sign as a literal character")
    void givenPercentThenMatchLiterally() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("q", "50%"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].sku").value("GC-025"));
        sendGetRequestWithQueryParams(PRODUCTS, params("q", "%"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("Treat the underscore as a literal character")
    void givenUnderscoreThenMatchLiterally() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("q", "_"))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("Filter by category ignoring the case")
    void givenCategoryThenFilter() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("category", "electronics"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @DisplayName("Filter by price range inclusive")
    void givenPriceRangeThenFilter() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("minPrice", "24.50", "maxPrice", "29.99"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @DisplayName("Return only products in stock")
    void givenInStockOnlyThenHideOutOfStock() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("inStockOnly", "true"))
                .andExpect(jsonPath("$.totalElements").value(5));
    }

    @Test
    @DisplayName("Combine several filters")
    void givenSeveralFiltersThenCombineThem() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("q", "wireless", "inStockOnly", "true"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].sku").value("WM-042"));
    }

    @Test
    @DisplayName("Return an empty page when nothing matches")
    void givenNoMatchThenReturnEmptyPage() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("q", "unicorn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    @DisplayName("Paginate the results sorted by name")
    void givenPageThenReturnThatSlice() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("page", "1", "size", "2"))
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].name").value("Running Shoes"))
                .andExpect(jsonPath("$.content[1].name").value("Wireless Keyboard"));
    }

    @Test
    @DisplayName("Sort by price descending")
    void givenSortThenOrderResults() throws Exception {
        sendGetRequestWithQueryParams(PRODUCTS, params("sort", "price,desc"))
                .andExpect(jsonPath("$.content[0].sku").value("RS-001"))
                .andExpect(jsonPath("$.content[5].sku").value("CB-010"));
    }
}
