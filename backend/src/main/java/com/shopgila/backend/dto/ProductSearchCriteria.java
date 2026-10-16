package com.shopgila.backend.dto;

import java.math.BigDecimal;

public record ProductSearchCriteria(
        String q,
        String category,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Boolean inStockOnly) {
}
