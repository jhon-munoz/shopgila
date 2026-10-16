package com.shopgila.backend.builder;

import com.shopgila.backend.model.Product;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

import static lombok.AccessLevel.PRIVATE;

@NoArgsConstructor(access = PRIVATE)
public class ProductBuilder {

    public static Product productWith(UUID id, String sku, String name, String category, BigDecimal price, int stock) {
        return Product.builder()
                .id(id)
                .sku(sku)
                .name(name)
                .category(category)
                .price(price)
                .stock(stock)
                .build();
    }

    public static Product defaultProduct() {
        return productWith(UUID.randomUUID(), "RS-001", "Running Shoes", "Footwear", new BigDecimal("89.99"), 150);
    }
}
