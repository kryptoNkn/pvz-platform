-- Add migration script here
CREATE TABLE IF NOT EXISTS pvz_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pvz_id UUID NOT NULL REFERENCES pvz(id) ON DELETE CASCADE,
    day_index SMALLINT NOT NULL CHECK (day_index BETWEEN 0 AND 6),
    is_day_off BOOLEAN NOT NULL DEFAULT false,
    start_time TEXT NOT NULL DEFAULT '09:00',
    end_time TEXT NOT NULL DEFAULT '21:00',
    UNIQUE (pvz_id, day_index)
);