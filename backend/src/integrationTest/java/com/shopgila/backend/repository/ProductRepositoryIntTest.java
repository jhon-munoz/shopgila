package com.shopgila.backend.repository;

import com.shopgila.backend.common.CommonIntegrationTests;
import com.shopgila.backend.model.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;

import java.util.List;
import java.util.UUID;

import static com.shopgila.backend.builder.ProductBuilder.productWith;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductRepositoryIntTest extends CommonIntegrationTests {

    @Test
    @DisplayName("Fill the id and the audit fields when saving")
    void givenNewProductThenFillIdAndAuditFields() {
        Product saved = productRepository.saveAndFlush(productWith("RS-001", "Shoes", "Footwear", "10.00", 1));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
        assertThat(saved.getVersion()).isZero();
    }

    @Test
    @DisplayName("Reject two products with the same SKU")
    void givenDuplicatedSkuThenFail() {
        productRepository.saveAndFlush(productWith("RS-001", "Shoes", "Footwear", "10.00", 1));

        assertThatThrownBy(() -> productRepository.saveAndFlush(productWith("RS-001", "Other", "Footwear", "10.00", 1)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Reject a negative price")
    void givenNegativePriceThenFail() {
        assertThatThrownBy(() -> productRepository.saveAndFlush(productWith("RS-001", "Shoes", "Footwear", "-1.00", 1)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Reject a negative stock")
    void givenNegativeStockThenFail() {
        assertThatThrownBy(() -> productRepository.saveAndFlush(productWith("RS-001", "Shoes", "Footwear", "1.00", -1)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Detect concurrent modifications with optimistic locking")
    void givenConcurrentUpdatesThenFailTheSecondOne() {
        Product saved = productRepository.saveAndFlush(productWith("RS-001", "Shoes", "Footwear", "10.00", 5));
        Product first = productRepository.findById(saved.getId()).orElseThrow();
        Product second = productRepository.findById(saved.getId()).orElseThrow();

        first.setStock(4);
        productRepository.saveAndFlush(first);
        second.setStock(3);

        assertThatThrownBy(() -> productRepository.saveAndFlush(second))
                .isInstanceOf(OptimisticLockingFailureException.class);
        assertThat(productRepository.findById(saved.getId()).orElseThrow().getStock()).isEqualTo(4);
    }

    @Test
    @DisplayName("Find existing products by a list of SKUs")
    void givenSkusThenFindThem() {
        productRepository.saveAndFlush(productWith("A-1", "A", "Books", "1.00", 1));
        productRepository.saveAndFlush(productWith("A-2", "B", "Books", "1.00", 1));
        productRepository.saveAndFlush(productWith("A-3", "C", "Books", "1.00", 1));

        List<Product> found = productRepository.findAllBySkuIn(List.of("A-1", "A-3", "UNKNOWN"));

        assertThat(found).extracting(Product::getSku).containsExactlyInAnyOrder("A-1", "A-3");
    }

    @Test
    @DisplayName("Check whether a SKU is taken by another product")
    void givenSkuThenCheckExistence() {
        Product saved = productRepository.saveAndFlush(productWith("A-1", "A", "Books", "1.00", 1));

        assertThat(productRepository.existsBySku("A-1")).isTrue();
        assertThat(productRepository.existsBySku("A-2")).isFalse();
        assertThat(productRepository.existsBySkuAndIdNot("A-1", saved.getId())).isFalse();
        assertThat(productRepository.existsBySkuAndIdNot("A-1", UUID.randomUUID())).isTrue();
    }

    @Test
    @DisplayName("Return the distinct categories sorted")
    void givenProductsThenReturnDistinctSortedCategories() {
        productRepository.saveAndFlush(productWith("A-1", "A", "Sports", "1.00", 1));
        productRepository.saveAndFlush(productWith("A-2", "B", "Books", "1.00", 1));
        productRepository.saveAndFlush(productWith("A-3", "C", "Sports", "1.00", 1));

        assertThat(productRepository.findDistinctCategories()).containsExactly("Books", "Sports");
    }
}
