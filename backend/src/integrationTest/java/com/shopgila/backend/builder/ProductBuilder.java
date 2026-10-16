package com.shopgila.backend.builder;

import com.shopgila.backend.model.Product;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import static lombok.AccessLevel.PRIVATE;

@NoArgsConstructor(access = PRIVATE)
public class ProductBuilder {

    public static Product productWith(String sku, String name, String category, String price, int stock) {
        return Product.builder()
                .sku(sku)
                .name(name)
                .category(category)
                .price(new BigDecimal(price))
                .stock(stock)
                .build();
    }

    public static Product productWith(String sku, String name, String category, String price, int stock, String description) {
        Product product = productWith(sku, name, category, price, stock);
        product.setDescription(description);
        return product;
    }
}
