package com.shopgila.backend.controller;

import com.shopgila.backend.common.CommonControllerTest;
import com.shopgila.backend.dto.ImportReportDto;
import com.shopgila.backend.dto.ImportReportDto.RowError;
import com.shopgila.backend.exception.ClientInvalidRequestException;
import com.shopgila.backend.service.ProductImportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static com.shopgila.backend.constants.Route.PRODUCT_IMPORT;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductImportController.class)
class ProductImportControllerTest extends CommonControllerTest {

    @MockitoBean
    private ProductImportService productImportService;

    private MockMultipartFile csvFile(String content) {
        return new MockMultipartFile("file", "products.csv", "text/csv", content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("Should return the import report")
    void shouldReturnImportReport() throws Exception {
        ImportReportDto report = ImportReportDto.builder()
                .totalRows(3).created(1).updated(1).failed(1).blankRows(0).duplicatesInFile(0)
                .errors(List.of(new RowError(4, "YM-015", "price is not a valid number: 'free'")))
                .build();
        when(productImportService.importProducts(any(InputStream.class))).thenReturn(report);

        mockMvc.perform(multipart(PRODUCT_IMPORT).file(csvFile("name,sku\nShoes,S-1\n")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created").value(1))
                .andExpect(jsonPath("$.failed").value(1))
                .andExpect(jsonPath("$.errors[0].line").value(4))
                .andExpect(jsonPath("$.errors[0].sku").value("YM-015"));
    }

    @Test
    @DisplayName("Should return 400 when the file is empty")
    void shouldRejectEmptyFile() throws Exception {
        mockMvc.perform(multipart(PRODUCT_IMPORT).file(csvFile("")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("The uploaded file is empty"));

        verifyNoInteractions(productImportService);
    }

    @Test
    @DisplayName("Should return 400 when the file part is missing")
    void shouldRejectMissingFilePart() throws Exception {
        mockMvc.perform(multipart(PRODUCT_IMPORT)).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 when the CSV is not valid")
    void shouldReturnBadRequestForInvalidCsv() throws Exception {
        when(productImportService.importProducts(any(InputStream.class)))
                .thenThrow(new ClientInvalidRequestException("CSV is missing required columns: price"));

        mockMvc.perform(multipart(PRODUCT_IMPORT).file(csvFile("name,sku\nShoes,S-1\n")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("CSV is missing required columns: price"));
    }
}
