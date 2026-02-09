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
    tracking_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
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

-- Index for fast lookup by tracking_token
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders (tracking_token);

-- ========================================
-- MIGRATION: Add tracking_token to existing orders
-- Run this in Supabase SQL Editor if the table already exists:
--
-- ALTER TABLE orders
--   ADD COLUMN IF NOT EXISTS tracking_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
-- CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders (tracking_token);
-- ========================================

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
-- MENU ITEMS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS menu_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    description   TEXT,
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    category      TEXT NOT NULL
                  CHECK (category IN ('mains', 'sides', 'drinks')),
    image_url     TEXT,
    is_available  BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Row-level security
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read menu items"
    ON menu_items FOR SELECT
    USING (is_available = true);

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
