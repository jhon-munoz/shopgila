package com.shopgila.backend.service;

import com.shopgila.backend.dto.PageResponse;
import com.shopgila.backend.dto.ProductDto;
import com.shopgila.backend.dto.ProductSearchCriteria;
import com.shopgila.backend.exception.ShopgilaApiException;
import com.shopgila.backend.mapper.ProductMapper;
import com.shopgila.backend.mapper.ProductMapperImpl;
import com.shopgila.backend.model.Product;
import com.shopgila.backend.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.shopgila.backend.builder.ProductBuilder.defaultProduct;
import static com.shopgila.backend.builder.ProductDtoBuilder.productDtoWith;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    private static final UUID ID = UUID.randomUUID();

    @Mock
    private ProductRepository productRepository;

    @Spy
    private ProductMapper productMapper = new ProductMapperImpl();

    @InjectMocks
    private ProductService service;

    private final ProductDto dto = productDtoWith("rs-001 ", "Running Shoes", "Footwear", new BigDecimal("89.99"), 150);

    @Test
    @DisplayName("Should create a product with a normalized SKU")
    void shouldCreateProduct() {
        when(productRepository.existsBySku("RS-001")).thenReturn(false);
        when(productRepository.saveAndFlush(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductDto result = service.create(dto);

        assertThat(result.sku()).isEqualTo("RS-001");
        assertThat(result.name()).isEqualTo("Running Shoes");
    }

    @Test
    @DisplayName("Should reject creating a product with an existing SKU")
    void shouldRejectDuplicatedSkuOnCreate() {
        when(productRepository.existsBySku("RS-001")).thenReturn(true);

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOfSatisfying(ShopgilaApiException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("RS-001");
        verify(productRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Should update an existing product")
    void shouldUpdateProduct() {
        Product existing = defaultProduct();
        when(productRepository.findById(ID)).thenReturn(Optional.of(existing));
        when(productRepository.existsBySkuAndIdNot("RS-001", ID)).thenReturn(false);
        when(productRepository.saveAndFlush(existing)).thenReturn(existing);

        ProductDto result = service.update(ID, productDtoWith("rs-001", "New Name", "Sports", BigDecimal.TEN, 3));

        assertThat(result.name()).isEqualTo("New Name");
        assertThat(result.category()).isEqualTo("Sports");
        assertThat(existing.getStock()).isEqualTo(3);
    }

    @Test
    @DisplayName("Should fail updating a product that does not exist")
    void shouldFailUpdatingMissingProduct() {
        when(productRepository.findById(ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(ID, dto))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(ID.toString());
    }

    @Test
    @DisplayName("Should reject updating a product to a SKU used by another one")
    void shouldRejectDuplicatedSkuOnUpdate() {
        Product existing = defaultProduct();
        when(productRepository.findById(ID)).thenReturn(Optional.of(existing));
        when(productRepository.existsBySkuAndIdNot("RS-001", ID)).thenReturn(true);

        assertThatThrownBy(() -> service.update(ID, dto))
                .isInstanceOfSatisfying(ShopgilaApiException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
        verify(productRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Should return a product by id")
    void shouldGetProduct() {
        Product existing = defaultProduct();
        when(productRepository.findById(ID)).thenReturn(Optional.of(existing));

        assertThat(service.get(ID).sku()).isEqualTo("RS-001");
    }

    @Test
    @DisplayName("Should fail getting a product that does not exist")
    void shouldFailGettingMissingProduct() {
        when(productRepository.findById(ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(ID)).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("Should delete an existing product")
    void shouldRemoveProduct() {
        Product existing = defaultProduct();
        when(productRepository.findById(ID)).thenReturn(Optional.of(existing));

        service.remove(ID);

        verify(productRepository).delete(existing);
    }

    @Test
    @DisplayName("Should fail deleting a product that does not exist")
    void shouldFailRemovingMissingProduct() {
        when(productRepository.findById(ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.remove(ID)).isInstanceOf(EntityNotFoundException.class);
        verify(productRepository, never()).delete(any(Product.class));
    }

    @Test
    @DisplayName("Should search products and map the page")
    void shouldSearchProducts() {
        Pageable pageable = PageRequest.of(0, 20);
        when(productRepository.findAll(ArgumentMatchers.<Specification<Product>>any(), ArgumentMatchers.eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(defaultProduct()), pageable, 1));

        PageResponse<ProductDto> result = service.search(
                new ProductSearchCriteria("shoes", null, null, null, false), pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.totalElements()).isEqualTo(1);
        assertThat(result.content().get(0).sku()).isEqualTo("RS-001");
    }

    @Test
    @DisplayName("Should return the distinct categories")
    void shouldReturnCategories() {
        when(productRepository.findDistinctCategories()).thenReturn(List.of("Books", "Footwear"));

        assertThat(service.getCategories()).containsExactly("Books", "Footwear");
    }
}
