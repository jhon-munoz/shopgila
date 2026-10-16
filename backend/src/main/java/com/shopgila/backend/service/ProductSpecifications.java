package com.shopgila.backend.service;

import com.shopgila.backend.dto.ProductSearchCriteria;
import com.shopgila.backend.model.Product;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import static lombok.AccessLevel.PRIVATE;

@NoArgsConstructor(access = PRIVATE)
public class ProductSpecifications {

    private static final char ESCAPE = '\\';

    public static Specification<Product> from(ProductSearchCriteria criteria) {
        List<Specification<Product>> filters = new ArrayList<>();
        if (hasText(criteria.q())) {
            filters.add(matchesText(criteria.q()));
        }
        if (hasText(criteria.category())) {
            String category = criteria.category().trim().toLowerCase(Locale.ROOT);
            filters.add((root, query, cb) -> cb.equal(cb.lower(root.get("category")), category));
        }
        if (criteria.minPrice() != null) {
            filters.add((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), criteria.minPrice()));
        }
        if (criteria.maxPrice() != null) {
            filters.add((root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), criteria.maxPrice()));
        }
        if (Boolean.TRUE.equals(criteria.inStockOnly())) {
            filters.add((root, query, cb) -> cb.greaterThan(root.get("stock"), 0));
        }
        return Specification.allOf(filters);
    }

    private static Specification<Product> matchesText(String text) {
        String pattern = "%" + escape(text.trim().toLowerCase(Locale.ROOT)) + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), pattern, ESCAPE),
                cb.like(cb.lower(root.get("sku")), pattern, ESCAPE),
                cb.like(cb.lower(root.get("description")), pattern, ESCAPE));
    }

    private static String escape(String text) {
        return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
