-- ============================================================================
-- Public Access RLS Policies for Digital Menu
-- ============================================================================
-- This script adds RLS policies to allow public (unauthenticated) access
-- to menu data (products, categories, modifiers) so the digital-menu app works
-- ============================================================================

-- Enable RLS on tables (if not already enabled)
ALTER TABLE businessmans ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PUBLIC READ POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active businessmans" ON businessmans;
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Public can view available products" ON products;
DROP POLICY IF EXISTS "Public can view modifiers" ON modifiers;
DROP POLICY IF EXISTS "Public can view product modifiers" ON product_modifiers;

-- Businessmans: Allow public to read active businesses
CREATE POLICY "Public can view active businessmans"
    ON businessmans FOR SELECT
    USING (is_active = true);

-- Categories: Allow public to read active categories
CREATE POLICY "Public can view active categories"
    ON categories FOR SELECT
    USING (is_active = true);

-- Products: Allow public to read available products
CREATE POLICY "Public can view available products"
    ON products FOR SELECT
    USING (is_available = true AND deleted_at IS NULL);

-- Modifiers: Allow public to read all modifiers
CREATE POLICY "Public can view modifiers"
    ON modifiers FOR SELECT
    USING (true);

-- Product Modifiers: Allow public to read product-modifier relationships
CREATE POLICY "Public can view product modifiers"
    ON product_modifiers FOR SELECT
    USING (true);

-- ============================================================================
-- AUTHENTICATED USER POLICIES (for dashboard)
-- ============================================================================

-- Categories: Allow business owners to manage their categories
CREATE POLICY "Users can manage their own categories"
    ON categories FOR ALL
    USING (
        businessman_id IN (
            SELECT id FROM businessmans WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        businessman_id IN (
            SELECT id FROM businessmans WHERE user_id = auth.uid()
        )
    );

-- Products: Allow business owners to manage their products
CREATE POLICY "Users can manage their own products"
    ON products FOR ALL
    USING (
        businessman_id IN (
            SELECT id FROM businessmans WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        businessman_id IN (
            SELECT id FROM businessmans WHERE user_id = auth.uid()
        )
    );

-- Modifiers: Allow business owners to manage their modifiers
CREATE POLICY "Users can manage their own modifiers"
    ON modifiers FOR ALL
    USING (
        businessman_id IN (
            SELECT id FROM businessmans WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        businessman_id IN (
            SELECT id FROM businessmans WHERE user_id = auth.uid()
        )
    );

-- Product Modifiers: Allow business owners to manage their product modifiers
CREATE POLICY "Users can manage their own product modifiers"
    ON product_modifiers FOR ALL
    USING (
        product_id IN (
            SELECT id FROM products WHERE businessman_id IN (
                SELECT id FROM businessmans WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        product_id IN (
            SELECT id FROM products WHERE businessman_id IN (
                SELECT id FROM businessmans WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- NOTES
-- ============================================================================
-- These policies allow:
-- 1. Public (unauthenticated) users to READ menu data (for digital-menu app)
-- 2. Authenticated business owners to MANAGE their own data (for dashboard)
-- 
-- If you get "policy already exists" errors, that's OK - it means the policies
-- are already in place. You can drop them first with:
-- DROP POLICY IF EXISTS "policy_name" ON table_name;
