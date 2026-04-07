CREATE TABLE IF NOT EXISTS pvz (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    size_type TEXT NOT NULL DEFAULT 'medium',
    location_type TEXT NOT NULL DEFAULT 'street',
    status TEXT NOT NULL DEFAULT 'active',
    max_capacity INTEGER NOT NULL DEFAULT 100,
    current_items INTEGER NOT NULL DEFAULT 0,
    hours TEXT NOT NULL DEFAULT '09:00 - 21:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
