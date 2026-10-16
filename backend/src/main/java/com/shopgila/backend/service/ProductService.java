package com.shopgila.backend.service;

import com.shopgila.backend.dto.PageResponse;
import com.shopgila.backend.dto.ProductDto;
import com.shopgila.backend.dto.ProductSearchCriteria;
import com.shopgila.backend.exception.ShopgilaApiException;
import com.shopgila.backend.mapper.ProductMapper;
import com.shopgila.backend.model.Product;
import com.shopgila.backend.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static com.shopgila.backend.constants.GeneralConstants.PRODUCT_NOT_FOUND;
import static com.shopgila.backend.constants.GeneralConstants.SKU_ALREADY_EXISTS;
import static org.springframework.http.HttpStatus.CONFLICT;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public PageResponse<ProductDto> search(ProductSearchCriteria criteria, Pageable pageable) {
        return PageResponse.of(
                productRepository.findAll(ProductSpecifications.from(criteria), pageable),
                productMapper::toDto);
    }

    public List<String> getCategories() {
        return productRepository.findDistinctCategories();
    }

    public ProductDto get(UUID id) {
        return productMapper.toDto(findById(id));
    }

    @Transactional
    public ProductDto create(ProductDto dto) {
        Product product = productMapper.toEntity(dto);
        assertSkuIsAvailable(product.getSku());
        log.debug("Creating product with sku {}", product.getSku());
        return productMapper.toDto(productRepository.saveAndFlush(product));
    }

    @Transactional
    public ProductDto update(UUID id, ProductDto dto) {
        Product product = findById(id);
        assertSkuIsAvailable(productMapper.normalizeSku(dto.sku()), id);
        productMapper.merge(product, dto);
        log.debug("Updating product {}", id);
        return productMapper.toDto(productRepository.saveAndFlush(product));
    }

    @Transactional
    public void remove(UUID id) {
        productRepository.delete(findById(id));
    }

    private Product findById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(PRODUCT_NOT_FOUND + id));
    }

    private void assertSkuIsAvailable(String sku) {
        if (productRepository.existsBySku(sku)) {
            throw new ShopgilaApiException(CONFLICT, SKU_ALREADY_EXISTS + sku);
        }
    }

    private void assertSkuIsAvailable(String sku, UUID id) {
        if (productRepository.existsBySkuAndIdNot(sku, id)) {
            throw new ShopgilaApiException(CONFLICT, SKU_ALREADY_EXISTS + sku);
        }
    }
}
