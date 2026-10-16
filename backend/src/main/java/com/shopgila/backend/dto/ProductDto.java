package com.shopgila.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Builder
public record ProductDto(
        UUID id,
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Size(max = 64) String sku,
        String description,
        @NotBlank @Size(max = 100) String category,
        @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal price,
        @NotNull @Min(0) Integer stock,
        @DecimalMin("0.000") @Digits(integer = 5, fraction = 3) BigDecimal weightKg,
        Instant createdAt,
        Instant updatedAt) {
}
