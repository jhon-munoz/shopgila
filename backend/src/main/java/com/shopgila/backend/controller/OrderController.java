package com.shopgila.backend.controller;

import com.shopgila.backend.dto.OrderDto;
import com.shopgila.backend.dto.OrderRequestDto;
import com.shopgila.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

import static com.shopgila.backend.constants.Route.ORDERS;
import static com.shopgila.backend.constants.Route.ORDER_ID;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping(ORDERS)
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderDto> placeOrder(@RequestBody @Valid OrderRequestDto order) {
        log.debug("Receiving request to place an order with {} items", order.items().size());
        OrderDto created = orderService.create(order);
        return ResponseEntity.created(URI.create(ORDERS + "/" + created.id())).body(created);
    }

    @GetMapping(ORDER_ID)
    public OrderDto retrieveOrderById(@PathVariable UUID orderId) {
        log.debug("Receiving request to retrieve order {}", orderId);
        return orderService.get(orderId);
    }
}
