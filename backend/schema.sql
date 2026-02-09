-- ========================================
-- ORDERS TABLE
-- Run this in Supabase SQL Editor
-- ========================================

CREATE TABLE IF NOT EXISTS orders (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number  INT NOT NULL,
    unit_number   TEXT NOT NULL,
    phone_number  TEXT,
    delivery_notes TEXT,
    items         JSONB NOT NULL DEFAULT '[]',
    total         NUMERIC(10,2) NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'preparing', 'ready', 'delivered')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by order_number
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);

-- Index for filtering active orders (owner dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)
    WHERE status != 'delivered';

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ========================================
-- RESTAURANT SETTINGS TABLE
-- Single-row config for the restaurant
-- ========================================

CREATE TABLE IF NOT EXISTS restaurant_settings (
    id                INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    accepting_orders  BOOLEAN NOT NULL DEFAULT true,
    prep_time_minutes INT NOT NULL DEFAULT 25 CHECK (prep_time_minutes BETWEEN 5 AND 120),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the single settings row
INSERT INTO restaurant_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Reuse the same updated_at trigger
CREATE OR REPLACE TRIGGER restaurant_settings_updated_at
    BEFORE UPDATE ON restaurant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
