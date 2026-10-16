CREATE TABLE IF NOT EXISTS shopgila.orders (
    id                UUID           PRIMARY KEY,
    total             NUMERIC(14, 2) NOT NULL,
    payment_reference VARCHAR(64)    NOT NULL,
    version           BIGINT         NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT ck_orders_total CHECK (total >= 0)
);

CREATE TABLE IF NOT EXISTS shopgila.order_items (
    id           UUID           PRIMARY KEY,
    order_id     UUID           NOT NULL REFERENCES shopgila.orders (id) ON DELETE CASCADE,
    product_id   UUID           NOT NULL REFERENCES shopgila.products (id),
    sku          VARCHAR(64)    NOT NULL,
    product_name VARCHAR(255)   NOT NULL,
    unit_price   NUMERIC(12, 2) NOT NULL,
    quantity     INTEGER        NOT NULL,
    subtotal     NUMERIC(14, 2) NOT NULL,
    CONSTRAINT uq_order_items_order_product UNIQUE (order_id, product_id),
    CONSTRAINT ck_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT ck_order_items_unit_price CHECK (unit_price >= 0),
    CONSTRAINT ck_order_items_subtotal CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON shopgila.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON shopgila.order_items (product_id);
