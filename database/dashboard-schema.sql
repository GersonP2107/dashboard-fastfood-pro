-- ============================================================================
-- Dashboard Database Schema Extensions
-- ============================================================================
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Table: business_settings
-- Stores global business configuration
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    businessman_id UUID NOT NULL REFERENCES businessmans(id) ON DELETE CASCADE,
    is_open BOOLEAN DEFAULT true,
    opening_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"22:00"},"tuesday":{"open":"09:00","close":"22:00"},"wednesday":{"open":"09:00","close":"22:00"},"thursday":{"open":"09:00","close":"22:00"},"friday":{"open":"09:00","close":"22:00"},"saturday":{"open":"09:00","close":"22:00"},"sunday":{"open":"09:00","close":"22:00"}}'::jsonb,
    auto_accept_orders BOOLEAN DEFAULT false,
    order_notification_sound BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(businessman_id)
);

-- Table: order_status_history
-- Tracks all status changes for orders
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_settings_businessman ON business_settings(businessman_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON order_status_history(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- business_settings policies
-- Allow authenticated users to read their own business settings
CREATE POLICY "Users can view their own business settings"
    ON business_settings FOR SELECT
    USING (
        businessman_id IN (
            SELECT id FROM businessmans WHERE user_id = auth.uid()
        )
    );

-- Allow authenticated users to update their own business settings
CREATE POLICY "Users can update their own business settings"
    ON business_settings FOR UPDATE
    USING (
        businessman_id IN (
            SELECT id FROM businessmans WHERE user_id = auth.uid()
        )
    );

-- Allow authenticated users to insert their own business settings
CREATE POLICY "Users can insert their own business settings"
    ON business_settings FOR INSERT
    WITH CHECK (
        businessman_id IN (
            SELECT id FROM businessmans WHERE user_id = auth.uid()
        )
    );

-- order_status_history policies
-- Allow authenticated users to view order history for their business
CREATE POLICY "Users can view order status history for their orders"
    ON order_status_history FOR SELECT
    USING (
        order_id IN (
            SELECT o.id FROM orders o
            INNER JOIN businessmans b ON o.businessman_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- Allow authenticated users to insert order status history
CREATE POLICY "Users can insert order status history"
    ON order_status_history FOR INSERT
    WITH CHECK (
        order_id IN (
            SELECT o.id FROM orders o
            INNER JOIN businessmans b ON o.businessman_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- ============================================================================
-- Trigger: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_settings_updated_at
    BEFORE UPDATE ON business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Initial Data: Create default settings for existing businesses
-- ============================================================================

INSERT INTO business_settings (businessman_id)
SELECT id FROM businessmans
WHERE id NOT IN (SELECT businessman_id FROM business_settings)
ON CONFLICT (businessman_id) DO NOTHING;
