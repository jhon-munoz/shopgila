package com.shopgila.backend.service;

import com.shopgila.backend.dto.OrderDto;
import com.shopgila.backend.dto.OrderItemRequestDto;
import com.shopgila.backend.dto.OrderRequestDto;
import com.shopgila.backend.dto.PaymentResult;
import com.shopgila.backend.exception.ShopgilaApiException;
import com.shopgila.backend.mapper.OrderMapper;
import com.shopgila.backend.model.Order;
import com.shopgila.backend.model.OrderItem;
import com.shopgila.backend.model.Product;
import com.shopgila.backend.repository.OrderRepository;
import com.shopgila.backend.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.shopgila.backend.constants.GeneralConstants.INSUFFICIENT_STOCK;
import static com.shopgila.backend.constants.GeneralConstants.ORDER_NOT_FOUND;
import static com.shopgila.backend.constants.GeneralConstants.PAYMENT_DECLINED;
import static com.shopgila.backend.constants.GeneralConstants.PRODUCT_NOT_FOUND;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.PAYMENT_REQUIRED;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PaymentService paymentService;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderDto create(OrderRequestDto request) {
        Map<UUID, Integer> quantities = quantitiesByProduct(request.items());
        List<Product> products = productRepository.findAllByIdForUpdate(quantities.keySet());

        assertAllProductsExist(quantities.keySet(), products);
        assertStockIsAvailable(products, quantities);

        Order order = buildOrder(products, quantities);
        PaymentResult payment = paymentService.charge(order.getTotal(), request.paymentToken());
        if (!payment.approved()) {
            log.info("Order rejected because the payment was declined: {}", payment.failureReason());
            throw new ShopgilaApiException(PAYMENT_REQUIRED, PAYMENT_DECLINED + payment.failureReason());
        }
        order.setPaymentReference(payment.reference());

        Order saved = orderRepository.saveAndFlush(order);
        log.info("Order {} created with {} items and total {}", saved.getId(), saved.getItems().size(), saved.getTotal());
        return orderMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public OrderDto get(UUID id) {
        return orderRepository.findById(id)
                .map(orderMapper::toDto)
                .orElseThrow(() -> new EntityNotFoundException(ORDER_NOT_FOUND + id));
    }

    private Map<UUID, Integer> quantitiesByProduct(List<OrderItemRequestDto> items) {
        Map<UUID, Integer> quantities = new LinkedHashMap<>();
        items.forEach(item -> quantities.merge(item.productId(), item.quantity(), Integer::sum));
        return quantities;
    }

    private void assertAllProductsExist(Set<UUID> requestedIds, List<Product> products) {
        Set<UUID> foundIds = products.stream().map(Product::getId).collect(Collectors.toSet());
        requestedIds.stream()
                .filter(id -> !foundIds.contains(id))
                .findFirst()
                .ifPresent(id -> {
                    throw new EntityNotFoundException(PRODUCT_NOT_FOUND + id);
                });
    }

    private void assertStockIsAvailable(List<Product> products, Map<UUID, Integer> quantities) {
        String shortages = products.stream()
                .filter(product -> product.getStock() < quantities.get(product.getId()))
                .map(product -> String.format("%s (requested %d, available %d)",
                        product.getSku(), quantities.get(product.getId()), product.getStock()))
                .collect(Collectors.joining("; "));
        if (!shortages.isEmpty()) {
            throw new ShopgilaApiException(CONFLICT, INSUFFICIENT_STOCK + shortages);
        }
    }

    private Order buildOrder(List<Product> products, Map<UUID, Integer> quantities) {
        Order order = new Order();
        BigDecimal total = BigDecimal.ZERO;
        for (Product product : products) {
            int quantity = quantities.get(product.getId());
            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));
            product.setStock(product.getStock() - quantity);
            order.addItem(OrderItem.builder()
                    .productId(product.getId())
                    .sku(product.getSku())
                    .productName(product.getName())
                    .unitPrice(product.getPrice())
                    .quantity(quantity)
                    .subtotal(subtotal)
                    .build());
            total = total.add(subtotal);
        }
        order.setTotal(total);
        return order;
    }
}
