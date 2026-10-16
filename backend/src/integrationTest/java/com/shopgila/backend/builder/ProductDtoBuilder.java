package com.shopgila.backend.builder;

import com.shopgila.backend.dto.ProductDto;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import static lombok.AccessLevel.PRIVATE;

@NoArgsConstructor(access = PRIVATE)
public class ProductDtoBuilder {

    public static ProductDto productDtoWith(String sku, String name, String category, String price, int stock) {
        return ProductDto.builder()
                .sku(sku)
                .name(name)
                .category(category)
                .price(new BigDecimal(price))
                .stock(stock)
                .build();
    }
}
