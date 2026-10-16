package com.shopgila.backend.mapper;

import com.shopgila.backend.dto.OrderDto;
import com.shopgila.backend.model.Order;
import com.shopgila.backend.model.OrderItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OrderMapperTest {

    private final OrderMapper mapper = new OrderMapperImpl();

    @Test
    @DisplayName("Should map an order with its items")
    void shouldMapOrderWithItems() {
        UUID productId = UUID.randomUUID();
        Order order = Order.builder().id(UUID.randomUUID()).total(new BigDecimal("59.98"))
                .paymentReference("PAY-1").build();
        order.addItem(OrderItem.builder().productId(productId).sku("WM-042").productName("Wireless Mouse")
                .unitPrice(new BigDecimal("29.99")).quantity(2).subtotal(new BigDecimal("59.98")).build());

        OrderDto dto = mapper.toDto(order);

        assertThat(dto.id()).isEqualTo(order.getId());
        assertThat(dto.total()).isEqualByComparingTo("59.98");
        assertThat(dto.paymentReference()).isEqualTo("PAY-1");
        assertThat(dto.items()).singleElement().satisfies(item -> {
            assertThat(item.productId()).isEqualTo(productId);
            assertThat(item.sku()).isEqualTo("WM-042");
            assertThat(item.productName()).isEqualTo("Wireless Mouse");
            assertThat(item.quantity()).isEqualTo(2);
        });
    }
}
