package com.shopgila.backend.controller;

import com.shopgila.backend.common.CommonIntegrationTests;
import com.shopgila.backend.dto.OrderItemRequestDto;
import com.shopgila.backend.dto.OrderRequestDto;
import com.shopgila.backend.model.Order;
import com.shopgila.backend.model.OrderItem;
import com.shopgila.backend.model.Product;
import com.shopgila.backend.repository.OrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static com.shopgila.backend.builder.OrderRequestBuilder.lineFor;
import static com.shopgila.backend.builder.OrderRequestBuilder.orderWith;
import static com.shopgila.backend.builder.ProductBuilder.productWith;
import static com.shopgila.backend.constants.Route.ORDERS;
import static com.shopgila.backend.constants.Route.PRODUCTS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OrderControllerIntTest extends CommonIntegrationTests {

    private static final String APPROVED_TOKEN = "tok_visa";
    private static final String DECLINED_TOKEN = "tok_declined";

    @Autowired
    private OrderRepository orderRepository;

    private Product savedProduct(String sku, String price, int stock) {
        return productRepository.saveAndFlush(productWith(sku, "Product " + sku, "Misc", price, stock));
    }

    private int stockOf(Product product) {
        return productRepository.findById(product.getId()).orElseThrow().getStock();
    }

    @Test
    @DisplayName("Place an order with several lines discounting the stock")
    void givenValidOrderThenPersistItAndDiscountStock() throws Exception {
        Product shoes = savedProduct("RS-001", "89.99", 10);
        Product mouse = savedProduct("WM-042", "29.99", 5);

        sendPostRequestWithBody(ORDERS, orderWith(APPROVED_TOKEN, lineFor(shoes, 2), lineFor(mouse, 1)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString(ORDERS + "/")))
                .andExpect(jsonPath("$.total").value(209.97))
                .andExpect(jsonPath("$.paymentReference").value(containsString("PAY-")))
                .andExpect(jsonPath("$.items.length()").value(2));

        assertThat(stockOf(shoes)).isEqualTo(8);
        assertThat(stockOf(mouse)).isEqualTo(4);
        List<Order> orders = orderRepository.findAll();
        assertThat(orders).hasSize(1);
        Order order = orderRepository.findById(orders.get(0).getId()).orElseThrow();
        assertThat(order.getTotal()).isEqualByComparingTo("209.97");
        assertThat(order.getCreatedAt()).isNotNull();
        assertThat(order.getItems()).extracting(OrderItem::getSku).containsExactlyInAnyOrder("RS-001", "WM-042");
    }

    @Test
    @DisplayName("Allow buying exactly the available stock")
    void givenAllTheStockThenLeaveItAtZero() throws Exception {
        Product mouse = savedProduct("WM-042", "29.99", 5);

        sendPostRequestWithBody(ORDERS, orderWith(APPROVED_TOKEN, lineFor(mouse, 5))).andExpect(status().isCreated());

        assertThat(stockOf(mouse)).isZero();
    }

    @Test
    @DisplayName("Add the quantities of the same product repeated in the order")
    void givenRepeatedProductThenAddQuantities() throws Exception {
        Product shoes = savedProduct("RS-001", "10.00", 10);

        sendPostRequestWithBody(ORDERS, orderWith(APPROVED_TOKEN, lineFor(shoes, 2), lineFor(shoes, 3)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].quantity").value(5))
                .andExpect(jsonPath("$.total").value(50.00));

        assertThat(stockOf(shoes)).isEqualTo(5);
    }

    @Test
    @DisplayName("Keep the price paid even if the product price changes later")
    void givenPriceChangeAfterPurchaseThenKeepOriginalPrice() throws Exception {
        Product shoes = savedProduct("RS-001", "89.99", 10);
        String body = sendPostRequestWithBody(ORDERS, orderWith(APPROVED_TOKEN, lineFor(shoes, 1)))
                .andReturn().getResponse().getContentAsString();
        UUID orderId = UUID.fromString(objectMapper.readTree(body).get("id").asString());

        Product stored = productRepository.findById(shoes.getId()).orElseThrow();
        stored.setPrice(new BigDecimal("999.00"));
        productRepository.saveAndFlush(stored);

        sendSimpleGetRequest(ORDERS + "/" + orderId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(89.99))
                .andExpect(jsonPath("$.items[0].unitPrice").value(89.99));
    }

    @Test
    @DisplayName("Reject the whole order when one line has not enough stock")
    void givenOneLineWithoutStockThenChangeNothing() throws Exception {
        Product shoes = savedProduct("RS-001", "89.99", 5);
        Product mouse = savedProduct("WM-042", "29.99", 1);

        sendPostRequestWithBody(ORDERS, orderWith(APPROVED_TOKEN, lineFor(shoes, 2), lineFor(mouse, 3)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Insufficient stock: WM-042 (requested 3, available 1)"));

        assertThat(stockOf(shoes)).isEqualTo(5);
        assertThat(stockOf(mouse)).isEqualTo(1);
        assertThat(orderRepository.count()).isZero();
    }

    @Test
    @DisplayName("Roll back the stock when the payment is declined")
    void givenDeclinedPaymentThenRollBackEverything() throws Exception {
        Product shoes = savedProduct("RS-001", "89.99", 5);
        Product mouse = savedProduct("WM-042", "29.99", 5);

        sendPostRequestWithBody(ORDERS, orderWith(DECLINED_TOKEN, lineFor(shoes, 2), lineFor(mouse, 1)))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.message").value("Payment declined: card declined"));

        assertThat(stockOf(shoes)).isEqualTo(5);
        assertThat(stockOf(mouse)).isEqualTo(5);
        assertThat(orderRepository.count()).isZero();
    }

    @Test
    @DisplayName("Return 404 and change nothing when a product does not exist")
    void givenUnknownProductThenReturnNotFound() throws Exception {
        Product shoes = savedProduct("RS-001", "89.99", 5);
        UUID unknown = UUID.randomUUID();
        OrderRequestDto request = OrderRequestDto.builder().paymentToken(APPROVED_TOKEN)
                .items(List.of(lineFor(shoes, 1),
                        OrderItemRequestDto.builder().productId(unknown).quantity(1).build()))
                .build();

        sendPostRequestWithBody(ORDERS, request)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Product not found: " + unknown));

        assertThat(stockOf(shoes)).isEqualTo(5);
        assertThat(orderRepository.count()).isZero();
    }

    @Test
    @DisplayName("Reject an invalid order")
    void givenInvalidOrderThenReturnBadRequest() throws Exception {
        Product shoes = savedProduct("RS-001", "89.99", 5);

        sendPostRequestWithBody(ORDERS, orderWith(APPROVED_TOKEN, lineFor(shoes, 0)))
                .andExpect(status().isBadRequest());
        sendPostRequestWithBody(ORDERS, orderWith(APPROVED_TOKEN))
                .andExpect(status().isBadRequest());

        assertThat(stockOf(shoes)).isEqualTo(5);
    }

    @Test
    @DisplayName("Retrieve an order by id")
    void givenExistingOrderThenRetrieveIt() throws Exception {
        Product shoes = savedProduct("RS-001", "10.00", 5);
        String body = sendPostRequestWithBody(ORDERS, orderWith(APPROVED_TOKEN, lineFor(shoes, 2)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(body).get("id").asString();

        sendSimpleGetRequest(ORDERS + "/" + orderId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(orderId))
                .andExpect(jsonPath("$.items[0].sku").value("RS-001"))
                .andExpect(jsonPath("$.items[0].subtotal").value(20.00));
    }

    @Test
    @DisplayName("Return 404 when retrieving an unknown order")
    void givenUnknownOrderThenReturnNotFound() throws Exception {
        sendSimpleGetRequest(ORDERS + "/" + UUID.randomUUID()).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Not allow deleting a product that has been purchased")
    void givenPurchasedProductThenRejectDeletion() throws Exception {
        Product shoes = savedProduct("RS-001", "10.00", 5);
        sendPostRequestWithBody(ORDERS, orderWith(APPROVED_TOKEN, lineFor(shoes, 1))).andExpect(status().isCreated());

        sendSimpleDeleteRequest(PRODUCTS + "/" + shoes.getId()).andExpect(status().isConflict());

        assertThat(productRepository.findById(shoes.getId())).isPresent();
    }

    @Test
    @DisplayName("Sell the last units only once when several buyers compete")
    void givenConcurrentBuyersThenNeverOversell() throws Exception {
        int stock = 5;
        int buyers = 10;
        Product lastUnits = savedProduct("HOT-001", "10.00", stock);
        ExecutorService executor = Executors.newFixedThreadPool(buyers);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Integer>> results = new ArrayList<>();

        for (int i = 0; i < buyers; i++) {
            results.add(executor.submit(() -> {
                start.await();
                return sendPostRequestWithBody(ORDERS, orderWith(APPROVED_TOKEN, lineFor(lastUnits, 1)))
                        .andReturn().getResponse().getStatus();
            }));
        }
        start.countDown();
        List<Integer> statuses = new ArrayList<>();
        for (Future<Integer> result : results) {
            statuses.add(result.get(30, TimeUnit.SECONDS));
        }
        executor.shutdown();

        assertThat(statuses).filteredOn(code -> code == 201).hasSize(stock);
        assertThat(statuses).filteredOn(code -> code == 409).hasSize(buyers - stock);
        assertThat(stockOf(lastUnits)).isZero();
        assertThat(orderRepository.count()).isEqualTo(stock);
    }
}
