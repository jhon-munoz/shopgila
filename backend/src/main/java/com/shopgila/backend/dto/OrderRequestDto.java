package com.shopgila.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;

@Builder
public record OrderRequestDto(
        @NotBlank @Size(max = 64) String paymentToken,
        @NotEmpty @Size(max = 50) List<@NotNull @Valid OrderItemRequestDto> items) {
}
