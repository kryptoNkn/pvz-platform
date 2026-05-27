-- Refresh marketplace demo data with richer product names and multi-item orders.

ALTER TABLE marketplace_order_items
    ADD COLUMN IF NOT EXISTS name TEXT;

INSERT INTO products (article, name, base_price)
VALUES
    ('IF17P-256', 'iPhone 17 Pro 256 GB', 149990),
    ('AIRP4-USB', 'AirPods Pro 4 USB-C', 29990),
    ('SONY-XM6', 'Sony WH-1000XM6', 39990),
    ('SGS26U-256', 'Samsung Galaxy S26 Ultra 256 GB', 134990),
    ('XPS13-U7', 'Dell XPS 13 Ultra 7', 139990),
    ('KIND-PPW', 'Kindle Paperwhite', 19990),
    ('MBA13-M3', 'MacBook Air 13 M3', 99990),
    ('DYS-AIRW', 'Dyson Airwrap i.d.', 59990),
    ('GAR-FR965', 'Garmin Forerunner 965', 64990),
    ('SW2-STD', 'Nintendo Switch 2 Standard', 49990),
    ('ECHO-10', 'Echo Show 10', 24990),
    ('BOSE-QC45', 'Bose QuietComfort 45', 32990)
ON CONFLICT (article)
DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price;

UPDATE products
SET
    name = 'iPhone 17 Pro 256 GB',
    base_price = 149990
WHERE article = 'OZ-SKU-001';

UPDATE products
SET
    name = 'Samsung Galaxy S26 Ultra 256 GB',
    base_price = 134990
WHERE article = 'WB-SKU-001';

UPDATE products
SET
    name = 'MacBook Air 13 M3',
    base_price = 99990
WHERE article = 'YM-SKU-001';

UPDATE products
SET
    name = 'Nintendo Switch 2 Standard',
    base_price = 49990
WHERE article = 'AV-SKU-001';

DELETE FROM marketplace_order_items
WHERE order_id IN (
    SELECT id
    FROM marketplace_orders
    WHERE external_id IN (
        'OZ-MOCK-ORDER-1',
        'WB-MOCK-ORDER-1',
        'YM-MOCK-ORDER-1',
        'AV-MOCK-ORDER-1'
    )
);

INSERT INTO marketplace_order_items (order_id, product_id, name, quantity, price)
SELECT mo.id, p.id, p.name, v.quantity, p.base_price
FROM marketplace_orders mo
JOIN (
    VALUES
        ('OZ-MOCK-ORDER-1', 'IF17P-256', 1),
        ('OZ-MOCK-ORDER-1', 'AIRP4-USB', 1),
        ('OZ-MOCK-ORDER-1', 'SONY-XM6', 2),
        ('WB-MOCK-ORDER-1', 'SGS26U-256', 1),
        ('WB-MOCK-ORDER-1', 'XPS13-U7', 1),
        ('WB-MOCK-ORDER-1', 'KIND-PPW', 2),
        ('YM-MOCK-ORDER-1', 'MBA13-M3', 1),
        ('YM-MOCK-ORDER-1', 'DYS-AIRW', 1),
        ('YM-MOCK-ORDER-1', 'GAR-FR965', 1),
        ('AV-MOCK-ORDER-1', 'SW2-STD', 1),
        ('AV-MOCK-ORDER-1', 'ECHO-10', 2),
        ('AV-MOCK-ORDER-1', 'BOSE-QC45', 1)
) AS v(external_id, article, quantity)
    ON mo.external_id = v.external_id
JOIN products p ON p.article = v.article;
