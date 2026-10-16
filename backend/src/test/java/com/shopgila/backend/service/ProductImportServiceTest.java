package com.shopgila.backend.service;

import com.shopgila.backend.dto.ImportReportDto;
import com.shopgila.backend.dto.ProductDto;
import com.shopgila.backend.helper.ProductCsvHelper;
import com.shopgila.backend.helper.ProductCsvHelper.CsvParseResult;
import com.shopgila.backend.helper.ProductCsvHelper.ParsedRow;
import com.shopgila.backend.mapper.ProductMapper;
import com.shopgila.backend.mapper.ProductMapperImpl;
import com.shopgila.backend.model.Product;
import com.shopgila.backend.repository.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static com.shopgila.backend.builder.ProductBuilder.productWith;
import static com.shopgila.backend.builder.ProductDtoBuilder.productDtoWith;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductImportServiceTest {

    @Mock
    private ProductCsvHelper csvHelper;

    @Mock
    private ProductRepository productRepository;

    @Spy
    private ProductMapper productMapper = new ProductMapperImpl();

    @InjectMocks
    private ProductImportService service;

    @Captor
    private ArgumentCaptor<List<Product>> savedProducts;

    private ParsedRow valid(long line, String sku, String name) {
        ProductDto dto = productDtoWith(sku, name, "Misc", BigDecimal.TEN, 1);
        return new ParsedRow(line, sku, dto, null);
    }

    private ByteArrayInputStream emptyInput() {
        return new ByteArrayInputStream(new byte[0]);
    }

    @Test
    @DisplayName("Should create new products and update existing ones")
    void shouldCreateAndUpdate() {
        Product existing = productWith(UUID.randomUUID(), "WM-042", "Old Mouse", "Electronics", BigDecimal.ONE, 5);
        when(csvHelper.parse(any())).thenReturn(new CsvParseResult(
                List.of(valid(2, "RS-001", "Shoes"), valid(3, "WM-042", "New Mouse")), 0));
        when(productRepository.findAllBySkuIn(anyCollection())).thenReturn(List.of(existing));

        ImportReportDto report = service.importProducts(emptyInput());

        assertThat(report.created()).isEqualTo(1);
        assertThat(report.updated()).isEqualTo(1);
        assertThat(report.failed()).isZero();
        verify(productRepository).saveAll(savedProducts.capture());
        assertThat(savedProducts.getValue()).hasSize(2);
        assertThat(existing.getName()).isEqualTo("New Mouse");
    }

    @Test
    @DisplayName("Should keep the last row when a SKU is repeated in the file")
    void shouldKeepLastRowForDuplicatedSku() {
        when(csvHelper.parse(any())).thenReturn(new CsvParseResult(
                List.of(valid(2, "RS-001", "First"), valid(3, "rs-001", "Second")), 0));
        when(productRepository.findAllBySkuIn(anyCollection())).thenReturn(List.of());

        ImportReportDto report = service.importProducts(emptyInput());

        assertThat(report.duplicatesInFile()).isEqualTo(1);
        assertThat(report.created()).isEqualTo(1);
        verify(productRepository).saveAll(savedProducts.capture());
        assertThat(savedProducts.getValue()).singleElement().satisfies(product -> {
            assertThat(product.getSku()).isEqualTo("RS-001");
            assertThat(product.getName()).isEqualTo("Second");
        });
    }

    @Test
    @DisplayName("Should report invalid rows and still import the valid ones")
    void shouldReportInvalidRowsAndImportValidOnes() {
        ParsedRow invalid = new ParsedRow(4, "YM-015", null, "price is not a valid number: 'free'");
        when(csvHelper.parse(any())).thenReturn(new CsvParseResult(List.of(valid(2, "RS-001", "Shoes"), invalid), 2));
        when(productRepository.findAllBySkuIn(anyCollection())).thenReturn(List.of());

        ImportReportDto report = service.importProducts(emptyInput());

        assertThat(report.totalRows()).isEqualTo(2);
        assertThat(report.created()).isEqualTo(1);
        assertThat(report.failed()).isEqualTo(1);
        assertThat(report.blankRows()).isEqualTo(2);
        assertThat(report.errors()).singleElement().satisfies(error -> {
            assertThat(error.line()).isEqualTo(4);
            assertThat(error.sku()).isEqualTo("YM-015");
            assertThat(error.message()).contains("free");
        });
    }

    @Test
    @DisplayName("Should return an empty report when the file has no rows")
    void shouldReturnEmptyReport() {
        when(csvHelper.parse(any())).thenReturn(new CsvParseResult(List.of(), 0));
        when(productRepository.findAllBySkuIn(anyCollection())).thenReturn(List.of());

        ImportReportDto report = service.importProducts(emptyInput());

        assertThat(report.totalRows()).isZero();
        assertThat(report.created()).isZero();
        assertThat(report.errors()).isEmpty();
    }
}
