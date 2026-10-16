package com.shopgila.backend.controller;

import com.shopgila.backend.dto.ImportReportDto;
import com.shopgila.backend.exception.ClientInvalidRequestException;
import com.shopgila.backend.service.ProductImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import static com.shopgila.backend.constants.GeneralConstants.CSV_UNREADABLE;
import static com.shopgila.backend.constants.GeneralConstants.EMPTY_FILE;
import static com.shopgila.backend.constants.Route.PRODUCT_IMPORT;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping(PRODUCT_IMPORT)
public class ProductImportController {

    private final ProductImportService productImportService;

    @PostMapping
    public ImportReportDto importProducts(@RequestParam("file") MultipartFile file) {
        log.debug("Receiving request to import products from file {}", file.getOriginalFilename());
        if (file.isEmpty()) {
            throw new ClientInvalidRequestException(EMPTY_FILE);
        }
        try {
            return productImportService.importProducts(file.getInputStream());
        } catch (IOException e) {
            throw new ClientInvalidRequestException(CSV_UNREADABLE + e.getMessage());
        }
    }
}
