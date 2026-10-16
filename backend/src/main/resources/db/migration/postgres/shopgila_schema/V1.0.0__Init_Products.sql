CREATE TABLE IF NOT EXISTS shopgila.products (
    id          UUID           PRIMARY KEY,
    name        VARCHAR(255)   NOT NULL,
    sku         VARCHAR(64)    NOT NULL,
    description TEXT,
    category    VARCHAR(100)   NOT NULL,
    price       NUMERIC(12, 2) NOT NULL,
    stock       INTEGER        NOT NULL,
    weight_kg   NUMERIC(8, 3),
    version     BIGINT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT uq_products_sku UNIQUE (sku),
    CONSTRAINT ck_products_price CHECK (price >= 0),
    CONSTRAINT ck_products_stock CHECK (stock >= 0),
    CONSTRAINT ck_products_weight CHECK (weight_kg IS NULL OR weight_kg >= 0)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON shopgila.products (category);
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON shopgila.products (lower(name));
