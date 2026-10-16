package com.shopgila.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.UUID;

@Builder
public record OrderItemRequestDto(
        @NotNull UUID productId,
        @NotNull @Min(1) @Max(1000) Integer quantity) {
}
