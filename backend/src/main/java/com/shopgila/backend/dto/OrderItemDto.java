package com.shopgila.backend.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Builder
public record OrderItemDto(
        UUID productId,
        String sku,
        String productName,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal subtotal) {
}
