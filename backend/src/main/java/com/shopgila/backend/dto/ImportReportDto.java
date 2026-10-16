package com.shopgila.backend.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record ImportReportDto(
        int totalRows,
        int created,
        int updated,
        int failed,
        int blankRows,
        int duplicatesInFile,
        List<RowError> errors) {

    public record RowError(long line, String sku, String message) {
    }
}
