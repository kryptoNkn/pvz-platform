INSERT INTO products (article, name, base_price)
VALUES
    ('OZ-SKU-001', 'Ozon Demo Product', 1200),
    ('WB-SKU-001', 'WB Demo Product', 1100),
    ('YM-SKU-001', 'Yandex Demo Product', 1300),
    ('AV-SKU-001', 'Avito Demo Product', 900)
ON CONFLICT (article) DO NOTHING;

INSERT INTO product_stocks (product_id, marketplace, stock)
SELECT p.id, 'WB', 5
FROM products p
WHERE p.article = 'WB-SKU-001'
ON CONFLICT (product_id, marketplace) DO NOTHING;

INSERT INTO marketplace_orders (marketplace, external_id, status, created_at)
VALUES
    ('Ozon', 'OZ-MOCK-ORDER-1', 'awaiting_packaging', NOW()),
    ('WB', 'WB-MOCK-ORDER-1', 'new', NOW()),
    ('Яндекс Маркет', 'YM-MOCK-ORDER-1', 'PROCESSING', NOW()),
    ('Авито', 'AV-MOCK-ORDER-1', 'created', NOW())
ON CONFLICT (marketplace, external_id) DO NOTHING;

INSERT INTO marketplace_order_items (order_id, product_id, quantity, price)
SELECT mo.id, p.id, 1, p.base_price
FROM marketplace_orders mo
JOIN products p ON p.article = 'OZ-SKU-001'
WHERE mo.external_id = 'OZ-MOCK-ORDER-1'
ON CONFLICT DO NOTHING;
