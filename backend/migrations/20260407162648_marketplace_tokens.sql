-- Add migration script here
CREATE TABLE IF NOT EXISTS marketplace_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace TEXT NOT NULL CHECK (marketplace IN ('Ozon','WB','Яндекс Маркет','Авито')),
    token TEXT,
    client_id TEXT,
    api_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
