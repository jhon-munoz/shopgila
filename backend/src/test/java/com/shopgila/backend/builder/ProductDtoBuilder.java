package com.shopgila.backend.builder;

import com.shopgila.backend.dto.ProductDto;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import static lombok.AccessLevel.PRIVATE;

@NoArgsConstructor(access = PRIVATE)
public class ProductDtoBuilder {

    public static ProductDto productDtoWith(String sku, String name, String category, BigDecimal price, int stock) {
        return ProductDto.builder()
                .sku(sku)
                .name(name)
                .category(category)
                .price(price)
                .stock(stock)
                .build();
    }

    public static ProductDto validProductDto() {
        return productDtoWith("RS-001", "Running Shoes", "Footwear", new BigDecimal("89.99"), 150);
    }
}
