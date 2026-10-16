package com.shopgila.backend.service;

import com.shopgila.backend.dto.OrderDto;
import com.shopgila.backend.dto.OrderItemRequestDto;
import com.shopgila.backend.dto.OrderRequestDto;
import com.shopgila.backend.dto.PaymentResult;
import com.shopgila.backend.exception.ShopgilaApiException;
import com.shopgila.backend.mapper.OrderMapper;
import com.shopgila.backend.mapper.OrderMapperImpl;
import com.shopgila.backend.model.Order;
import com.shopgila.backend.model.OrderItem;
import com.shopgila.backend.model.Product;
import com.shopgila.backend.repository.OrderRepository;
import com.shopgila.backend.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.shopgila.backend.builder.ProductBuilder.productWith;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    private static final String TOKEN = "tok_visa";

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private PaymentService paymentService;

    @Spy
    private OrderMapper orderMapper = new OrderMapperImpl();

    @InjectMocks
    private OrderService service;

    private final Product shoes = productWith(UUID.randomUUID(), "RS-001", "Running Shoes", "Footwear", new BigDecimal("89.99"), 10);
    private final Product mouse = productWith(UUID.randomUUID(), "WM-042", "Wireless Mouse", "Electronics", new BigDecimal("29.99"), 5);

    private OrderRequestDto request(OrderItemRequestDto... items) {
        return OrderRequestDto.builder().paymentToken(TOKEN).items(List.of(items)).build();
    }

    private OrderItemRequestDto line(Product product, int quantity) {
        return OrderItemRequestDto.builder().productId(product.getId()).quantity(quantity).build();
    }

    private void givenProductsAreFound(Product... products) {
        when(productRepository.findAllByIdForUpdate(anyCollection())).thenReturn(List.of(products));
    }

    private void givenPaymentIsApproved() {
        when(paymentService.charge(any(), eq(TOKEN))).thenReturn(PaymentResult.approved("PAY-1"));
        when(orderRepository.saveAndFlush(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("Should place an order, discount the stock and charge the total")
    void shouldPlaceOrder() {
        givenProductsAreFound(shoes);
        givenPaymentIsApproved();

        OrderDto result = service.create(request(line(shoes, 3)));

        assertThat(shoes.getStock()).isEqualTo(7);
        assertThat(result.total()).isEqualByComparingTo("269.97");
        assertThat(result.paymentReference()).isEqualTo("PAY-1");
        assertThat(result.items()).singleElement().satisfies(item -> {
            assertThat(item.sku()).isEqualTo("RS-001");
            assertThat(item.unitPrice()).isEqualByComparingTo("89.99");
            assertThat(item.quantity()).isEqualTo(3);
            assertThat(item.subtotal()).isEqualByComparingTo("269.97");
        });
        verify(paymentService).charge(result.total(), TOKEN);
    }

    @Test
    @DisplayName("Should add the subtotals of several lines")
    void shouldPlaceOrderWithSeveralLines() {
        givenProductsAreFound(shoes, mouse);
        givenPaymentIsApproved();

        OrderDto result = service.create(request(line(shoes, 1), line(mouse, 2)));

        assertThat(result.items()).hasSize(2);
        assertThat(result.total()).isEqualByComparingTo("149.97");
        assertThat(shoes.getStock()).isEqualTo(9);
        assertThat(mouse.getStock()).isEqualTo(3);
    }

    @Test
    @DisplayName("Should add the quantities of repeated products")
    void shouldAddRepeatedProducts() {
        givenProductsAreFound(shoes);
        givenPaymentIsApproved();

        OrderDto result = service.create(request(line(shoes, 2), line(shoes, 3)));

        assertThat(result.items()).singleElement().satisfies(item -> assertThat(item.quantity()).isEqualTo(5));
        assertThat(shoes.getStock()).isEqualTo(5);
    }

    @Test
    @DisplayName("Should accept buying exactly the available stock")
    void shouldAcceptBuyingAllTheStock() {
        givenProductsAreFound(mouse);
        givenPaymentIsApproved();

        service.create(request(line(mouse, 5)));

        assertThat(mouse.getStock()).isZero();
    }

    @Test
    @DisplayName("Should reject the order when there is not enough stock and change nothing")
    void shouldRejectWhenStockIsNotEnough() {
        givenProductsAreFound(shoes, mouse);

        assertThatThrownBy(() -> service.create(request(line(shoes, 1), line(mouse, 6))))
                .isInstanceOfSatisfying(ShopgilaApiException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("WM-042 (requested 6, available 5)")
                .hasMessageNotContaining("RS-001");
        assertThat(shoes.getStock()).isEqualTo(10);
        assertThat(mouse.getStock()).isEqualTo(5);
        verifyNoInteractions(paymentService);
        verify(orderRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Should report every product without enough stock")
    void shouldReportEveryShortage() {
        givenProductsAreFound(shoes, mouse);

        assertThatThrownBy(() -> service.create(request(line(shoes, 11), line(mouse, 6))))
                .hasMessageContaining("RS-001")
                .hasMessageContaining("WM-042");
    }

    @Test
    @DisplayName("Should reject the order when a product does not exist")
    void shouldRejectUnknownProduct() {
        UUID unknown = UUID.randomUUID();
        givenProductsAreFound(shoes);
        OrderItemRequestDto missing = OrderItemRequestDto.builder().productId(unknown).quantity(1).build();

        assertThatThrownBy(() -> service.create(request(line(shoes, 1), missing)))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(unknown.toString());
        verifyNoInteractions(paymentService);
        verify(orderRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Should reject the order without saving it when the payment is declined")
    void shouldRejectWhenPaymentIsDeclined() {
        givenProductsAreFound(shoes);
        when(paymentService.charge(any(), eq(TOKEN))).thenReturn(PaymentResult.declined("card declined"));

        assertThatThrownBy(() -> service.create(request(line(shoes, 1))))
                .isInstanceOfSatisfying(ShopgilaApiException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.PAYMENT_REQUIRED))
                .hasMessage("Payment declined: card declined");
        verify(orderRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Should charge the price stored in the database")
    void shouldChargeDatabasePrice() {
        givenProductsAreFound(mouse);
        givenPaymentIsApproved();
        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);

        service.create(request(line(mouse, 2)));

        verify(orderRepository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getTotal()).isEqualByComparingTo("59.98");
        assertThat(saved.getValue().getItems()).extracting(OrderItem::getProductId).containsExactly(mouse.getId());
    }

    @Test
    @DisplayName("Should return an order by id")
    void shouldGetOrder() {
        UUID id = UUID.randomUUID();
        Order order = Order.builder().id(id).total(BigDecimal.TEN).paymentReference("PAY-1").build();
        when(orderRepository.findById(id)).thenReturn(Optional.of(order));

        assertThat(service.get(id).id()).isEqualTo(id);
    }

    @Test
    @DisplayName("Should fail getting an order that does not exist")
    void shouldFailGettingMissingOrder() {
        UUID id = UUID.randomUUID();
        when(orderRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(id))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(id.toString());
    }
}
