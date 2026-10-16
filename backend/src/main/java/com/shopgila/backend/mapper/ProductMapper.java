package com.shopgila.backend.mapper;

import com.shopgila.backend.dto.ProductDto;
import com.shopgila.backend.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.util.Locale;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    ProductDto toDto(Product product);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "name", qualifiedByName = "trim")
    @Mapping(target = "description", qualifiedByName = "trim")
    @Mapping(target = "category", qualifiedByName = "trim")
    @Mapping(target = "sku", qualifiedByName = "normalizeSku")
    void merge(@MappingTarget Product target, ProductDto dto);

    default Product toEntity(ProductDto dto) {
        Product product = new Product();
        merge(product, dto);
        return product;
    }

    @Named("normalizeSku")
    default String normalizeSku(String sku) {
        return sku == null ? null : sku.trim().toUpperCase(Locale.ROOT);
    }

    @Named("trim")
    default String trim(String value) {
        return value == null ? null : value.trim();
    }
}
