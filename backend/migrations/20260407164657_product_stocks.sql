-- Add migration script here
CREATE TABLE IF NOT EXISTS product_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    marketplace TEXT NOT NULL CHECK (marketplace IN ('Ozon','WB','Яндекс Маркет','Авито')),
    stock INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, marketplace)
);
