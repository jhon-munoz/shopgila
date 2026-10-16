package com.shopgila.backend.mapper;

import com.shopgila.backend.dto.ProductDto;
import com.shopgila.backend.model.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static com.shopgila.backend.builder.ProductBuilder.defaultProduct;
import static org.assertj.core.api.Assertions.assertThat;

class ProductMapperTest {

    private final ProductMapper mapper = new ProductMapperImpl();

    @Test
    @DisplayName("Should upper-case the SKU and trim text fields when mapping to entity")
    void shouldNormalizeSkuAndTrimTextFields() {
        ProductDto dto = ProductDto.builder()
                .name("  Running Shoes ")
                .sku("  rs-001 ")
                .description(" light ")
                .category(" Footwear ")
                .price(new BigDecimal("89.99"))
                .stock(10)
                .build();

        Product entity = mapper.toEntity(dto);

        assertThat(entity.getSku()).isEqualTo("RS-001");
        assertThat(entity.getName()).isEqualTo("Running Shoes");
        assertThat(entity.getDescription()).isEqualTo("light");
        assertThat(entity.getCategory()).isEqualTo("Footwear");
        assertThat(entity.getStock()).isEqualTo(10);
    }

    @Test
    @DisplayName("Should ignore id and audit fields coming from the client")
    void shouldIgnoreIdAndAuditFieldsFromDto() {
        ProductDto dto = ProductDto.builder()
                .id(UUID.randomUUID())
                .name("Shoes")
                .sku("S-1")
                .category("Footwear")
                .price(BigDecimal.TEN)
                .stock(1)
                .createdAt(Instant.parse("2020-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2020-01-01T00:00:00Z"))
                .build();

        Product entity = mapper.toEntity(dto);

        assertThat(entity.getId()).isNull();
        assertThat(entity.getCreatedAt()).isNull();
        assertThat(entity.getUpdatedAt()).isNull();
    }

    @Test
    @DisplayName("Should keep the identity of the target when merging")
    void shouldKeepIdentityWhenMerging() {
        Product target = defaultProduct();
        UUID originalId = target.getId();
        ProductDto dto = ProductDto.builder()
                .id(UUID.randomUUID())
                .name("New name")
                .sku("new-1")
                .category("Sports")
                .price(new BigDecimal("5.00"))
                .stock(3)
                .build();

        mapper.merge(target, dto);

        assertThat(target.getId()).isEqualTo(originalId);
        assertThat(target.getName()).isEqualTo("New name");
        assertThat(target.getSku()).isEqualTo("NEW-1");
        assertThat(target.getCategory()).isEqualTo("Sports");
        assertThat(target.getStock()).isEqualTo(3);
    }

    @Test
    @DisplayName("Should map entity to DTO including id and audit fields")
    void shouldMapEntityToDto() {
        Product entity = defaultProduct();
        entity.setWeightKg(new BigDecimal("0.350"));

        ProductDto dto = mapper.toDto(entity);

        assertThat(dto.id()).isEqualTo(entity.getId());
        assertThat(dto.sku()).isEqualTo("RS-001");
        assertThat(dto.price()).isEqualByComparingTo("89.99");
        assertThat(dto.weightKg()).isEqualByComparingTo("0.350");
    }

    @Test
    @DisplayName("Should return null when normalizing a null SKU")
    void shouldReturnNullForNullSku() {
        assertThat(mapper.normalizeSku(null)).isNull();
    }
}
