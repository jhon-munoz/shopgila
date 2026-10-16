package com.shopgila.backend.builder;

import com.shopgila.backend.dto.OrderItemRequestDto;
import com.shopgila.backend.dto.OrderRequestDto;
import com.shopgila.backend.model.Product;
import lombok.NoArgsConstructor;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@NoArgsConstructor(access = PRIVATE)
public class OrderRequestBuilder {

    public static OrderItemRequestDto lineFor(Product product, int quantity) {
        return OrderItemRequestDto.builder().productId(product.getId()).quantity(quantity).build();
    }

    public static OrderRequestDto orderWith(String paymentToken, OrderItemRequestDto... items) {
        return OrderRequestDto.builder().paymentToken(paymentToken).items(List.of(items)).build();
    }
}
