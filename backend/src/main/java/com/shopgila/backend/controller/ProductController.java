package com.shopgila.backend.controller;

import com.shopgila.backend.dto.PageResponse;
import com.shopgila.backend.dto.ProductDto;
import com.shopgila.backend.dto.ProductSearchCriteria;
import com.shopgila.backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import static com.shopgila.backend.constants.Route.PRODUCTS;
import static com.shopgila.backend.constants.Route.PRODUCT_CATEGORIES;
import static com.shopgila.backend.constants.Route.PRODUCT_ID;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping(PRODUCTS)
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public PageResponse<ProductDto> searchProducts(
            ProductSearchCriteria criteria,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        log.debug("Receiving request to search products with {}", criteria);
        return productService.search(criteria, pageable);
    }

    @GetMapping(PRODUCT_CATEGORIES)
    public List<String> retrieveCategories() {
        return productService.getCategories();
    }

    @GetMapping(PRODUCT_ID)
    public ProductDto retrieveProductById(@PathVariable UUID productId) {
        log.debug("Receiving request to retrieve product {}", productId);
        return productService.get(productId);
    }

    @PostMapping
    public ResponseEntity<ProductDto> saveProduct(@RequestBody @Valid ProductDto product) {
        log.debug("Receiving request to save product with sku {}", product.sku());
        ProductDto created = productService.create(product);
        return ResponseEntity.created(URI.create(PRODUCTS + "/" + created.id())).body(created);
    }

    @PutMapping(PRODUCT_ID)
    public ProductDto updateProduct(@PathVariable UUID productId, @RequestBody @Valid ProductDto product) {
        log.debug("Receiving request to update product {}", productId);
        return productService.update(productId, product);
    }

    @DeleteMapping(PRODUCT_ID)
    public ResponseEntity<Void> deleteProductById(@PathVariable UUID productId) {
        log.debug("Receiving request to delete product {}", productId);
        productService.remove(productId);
        return ResponseEntity.noContent().build();
    }
}
