package com.shopgila.backend.controller;

import com.shopgila.backend.common.CommonControllerTest;
import com.shopgila.backend.dto.OrderDto;
import com.shopgila.backend.dto.OrderItemDto;
import com.shopgila.backend.dto.OrderItemRequestDto;
import com.shopgila.backend.dto.OrderRequestDto;
import com.shopgila.backend.exception.ShopgilaApiException;
import com.shopgila.backend.service.OrderService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static com.shopgila.backend.constants.Route.ORDERS;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
class OrderControllerTest extends CommonControllerTest {

    private static final UUID ORDER_ID = UUID.randomUUID();
    private static final UUID PRODUCT_ID = UUID.randomUUID();

    @MockitoBean
    private OrderService orderService;

    private OrderRequestDto validRequest() {
        return OrderRequestDto.builder()
                .paymentToken("tok_visa")
                .items(List.of(OrderItemRequestDto.builder().productId(PRODUCT_ID).quantity(2).build()))
                .build();
    }

    private OrderDto createdOrder() {
        return OrderDto.builder().id(ORDER_ID).total(new BigDecimal("59.98")).paymentReference("PAY-1")
                .items(List.of(OrderItemDto.builder().productId(PRODUCT_ID).sku("WM-042").productName("Wireless Mouse")
                        .unitPrice(new BigDecimal("29.99")).quantity(2).subtotal(new BigDecimal("59.98")).build()))
                .build();
    }

    @Test
    @DisplayName("Should place an order and return 201 with its location")
    void shouldPlaceOrder() throws Exception {
        when(orderService.create(any())).thenReturn(createdOrder());

        sendPostRequestWithBody(ORDERS, validRequest())
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", ORDERS + "/" + ORDER_ID))
                .andExpect(jsonPath("$.paymentReference").value("PAY-1"))
                .andExpect(jsonPath("$.items[0].sku").value("WM-042"));
    }

    @Test
    @DisplayName("Should return 400 when the cart is empty")
    void shouldRejectEmptyCart() throws Exception {
        OrderRequestDto request = OrderRequestDto.builder().paymentToken("tok_visa").items(List.of()).build();

        sendPostRequestWithBody(ORDERS, request)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details", hasItem("items: must not be empty")));
        verifyNoInteractions(orderService);
    }

    @Test
    @DisplayName("Should return 400 when a quantity is lower than one")
    void shouldRejectInvalidQuantity() throws Exception {
        OrderRequestDto request = OrderRequestDto.builder().paymentToken("tok_visa")
                .items(List.of(OrderItemRequestDto.builder().productId(PRODUCT_ID).quantity(0).build())).build();

        sendPostRequestWithBody(ORDERS, request)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details", hasItem("items[0].quantity: must be greater than or equal to 1")));
    }

    @Test
    @DisplayName("Should return 400 when the product id or the payment token is missing")
    void shouldRejectMissingFields() throws Exception {
        OrderRequestDto request = OrderRequestDto.builder().paymentToken(" ")
                .items(List.of(OrderItemRequestDto.builder().quantity(1).build())).build();

        sendPostRequestWithBody(ORDERS, request)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details", hasItem("paymentToken: must not be blank")))
                .andExpect(jsonPath("$.details", hasItem("items[0].productId: must not be null")));
    }

    @Test
    @DisplayName("Should return 409 when there is not enough stock")
    void shouldReturnConflictWithoutStock() throws Exception {
        when(orderService.create(any())).thenThrow(
                new ShopgilaApiException(HttpStatus.CONFLICT, "Insufficient stock: WM-042 (requested 6, available 5)"));

        sendPostRequestWithBody(ORDERS, validRequest())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Insufficient stock: WM-042 (requested 6, available 5)"));
    }

    @Test
    @DisplayName("Should return 402 when the payment is declined")
    void shouldReturnPaymentRequired() throws Exception {
        when(orderService.create(any())).thenThrow(
                new ShopgilaApiException(HttpStatus.PAYMENT_REQUIRED, "Payment declined: card declined"));

        sendPostRequestWithBody(ORDERS, validRequest())
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.message").value("Payment declined: card declined"));
    }

    @Test
    @DisplayName("Should return 404 when a product does not exist")
    void shouldReturnNotFoundForUnknownProduct() throws Exception {
        when(orderService.create(any())).thenThrow(new EntityNotFoundException("Product not found: " + PRODUCT_ID));

        sendPostRequestWithBody(ORDERS, validRequest()).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return an order by id")
    void shouldReturnOrderById() throws Exception {
        when(orderService.get(ORDER_ID)).thenReturn(createdOrder());

        sendSimpleGetRequest(ORDERS + "/" + ORDER_ID)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ORDER_ID.toString()))
                .andExpect(jsonPath("$.total").value(59.98));
    }

    @Test
    @DisplayName("Should return 404 when the order does not exist")
    void shouldReturnNotFoundForUnknownOrder() throws Exception {
        when(orderService.get(ORDER_ID)).thenThrow(new EntityNotFoundException("Order not found: " + ORDER_ID));

        sendSimpleGetRequest(ORDERS + "/" + ORDER_ID).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return 400 when the order id is not a UUID")
    void shouldReturnBadRequestForInvalidOrderId() throws Exception {
        sendSimpleGetRequest(ORDERS + "/not-a-uuid").andExpect(status().isBadRequest());
    }
}
