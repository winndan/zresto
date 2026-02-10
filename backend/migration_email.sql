-- ========================================
-- Add email column to orders
-- Run this in Supabase SQL Editor
-- ========================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT;
