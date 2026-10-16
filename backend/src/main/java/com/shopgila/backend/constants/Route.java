package com.shopgila.backend.constants;

import lombok.NoArgsConstructor;

import static lombok.AccessLevel.PRIVATE;

@NoArgsConstructor(access = PRIVATE)
public class Route {
    public static final String API_V1 = "/api/v1";
    public static final String PRODUCTS = API_V1 + "/products";
    public static final String PRODUCT_ID = "/{productId}";
    public static final String PRODUCT_CATEGORIES = "/categories";
    public static final String PRODUCT_IMPORT = PRODUCTS + "/import";
    public static final String ORDERS = API_V1 + "/orders";
    public static final String ORDER_ID = "/{orderId}";
}
