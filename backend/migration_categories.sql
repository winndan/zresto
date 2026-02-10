-- ========================================
-- CATEGORIES TABLE
-- Run this in Supabase SQL Editor
-- ========================================

CREATE TABLE IF NOT EXISTS categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL UNIQUE,
    display_name  TEXT NOT NULL,
    emoji         TEXT DEFAULT '',
    sort_order    INT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Seed with existing categories
INSERT INTO categories (name, display_name, emoji, sort_order) VALUES
    ('mains', 'Mains', '🍛', 1),
    ('sides', 'Sides', '🥗', 2),
    ('drinks', 'Drinks', '🥤', 3)
ON CONFLICT (name) DO NOTHING;

-- Drop the hard-coded CHECK constraint on menu_items.category
-- so new categories can be used
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_category_check;

-- Row-level security for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage categories"
    ON categories FOR ALL
    USING (true)
    WITH CHECK (true);
