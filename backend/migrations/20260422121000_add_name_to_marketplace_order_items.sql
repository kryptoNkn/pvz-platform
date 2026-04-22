ALTER TABLE marketplace_order_items
    ADD COLUMN IF NOT EXISTS name TEXT;

UPDATE marketplace_order_items moi
SET name = p.name
FROM products p
WHERE p.id = moi.product_id
  AND (moi.name IS NULL OR moi.name = '');

ALTER TABLE marketplace_order_items
    ALTER COLUMN name SET NOT NULL;
