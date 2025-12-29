-- ============================================================================
-- Fix Business Access RLS Policies
-- ============================================================================

-- 1. Allow authenticated users to VIEW their own business record
-- This is critical so they can load their dashboard even if the business is inactive
CREATE POLICY "Users can view their own business"
ON businessmans FOR SELECT
USING (user_id = auth.uid());

-- 2. Allow authenticated users to UPDATE their own business record
CREATE POLICY "Users can update their own business"
ON businessmans FOR UPDATE
USING (user_id = auth.uid());

-- 3. Diagnostic Query (Select this to verify your user ID matches)
-- Replace the UUID below with your User ID if different, but this query 
-- just lists all businesses to see what's there.
-- SELECT id, business_name, user_id, is_active FROM businessmans;
