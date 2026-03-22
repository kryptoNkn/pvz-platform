CREATE TABLE operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pvz_id UUID NOT NULL REFERENCES pvz(id) ON DELETE CASCADE,
    op_type VARCHAR(10) NOT NULL CHECK (op_type IN ('in', 'out', 'return')),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operations_pvz_id ON operations(pvz_id);
CREATE INDEX idx_operations_op_type ON operations(op_type);
CREATE INDEX idx_operations_created_at ON operations(created_at DESC);
