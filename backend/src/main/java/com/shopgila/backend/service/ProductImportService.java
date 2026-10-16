package com.shopgila.backend.service;

import com.shopgila.backend.dto.ImportReportDto;
import com.shopgila.backend.dto.ImportReportDto.RowError;
import com.shopgila.backend.dto.ProductDto;
import com.shopgila.backend.helper.ProductCsvHelper;
import com.shopgila.backend.helper.ProductCsvHelper.CsvParseResult;
import com.shopgila.backend.helper.ProductCsvHelper.ParsedRow;
import com.shopgila.backend.mapper.ProductMapper;
import com.shopgila.backend.model.Product;
import com.shopgila.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductImportService {

    private final ProductCsvHelper csvHelper;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Transactional
    public ImportReportDto importProducts(InputStream csv) {
        CsvParseResult parsed = csvHelper.parse(csv);

        List<RowError> errors = new ArrayList<>();
        Map<String, ProductDto> productsBySku = new LinkedHashMap<>();
        int duplicates = 0;
        for (ParsedRow row : parsed.rows()) {
            if (!row.isValid()) {
                errors.add(new RowError(row.line(), row.sku(), row.error()));
            } else if (productsBySku.put(productMapper.normalizeSku(row.sku()), row.product()) != null) {
                duplicates++;
            }
        }

        Map<String, Product> existing = productRepository.findAllBySkuIn(productsBySku.keySet()).stream()
                .collect(Collectors.toMap(Product::getSku, Function.identity()));
        List<Product> toSave = new ArrayList<>();
        int created = 0;
        int updated = 0;
        for (Map.Entry<String, ProductDto> entry : productsBySku.entrySet()) {
            Product product = existing.get(entry.getKey());
            if (product == null) {
                product = productMapper.toEntity(entry.getValue());
                created++;
            } else {
                productMapper.merge(product, entry.getValue());
                updated++;
            }
            toSave.add(product);
        }
        productRepository.saveAll(toSave);

        log.info("CSV import finished: {} created, {} updated, {} failed", created, updated, errors.size());
        return ImportReportDto.builder()
                .totalRows(parsed.rows().size())
                .created(created)
                .updated(updated)
                .failed(errors.size())
                .blankRows(parsed.blankRows())
                .duplicatesInFile(duplicates)
                .errors(errors)
                .build();
    }
}
