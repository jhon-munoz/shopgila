package com.shopgila.backend.mapper;

import com.shopgila.backend.dto.OrderDto;
import com.shopgila.backend.dto.OrderItemDto;
import com.shopgila.backend.model.Order;
import com.shopgila.backend.model.OrderItem;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    OrderDto toDto(Order order);

    OrderItemDto toDto(OrderItem item);
}
