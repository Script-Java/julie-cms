-- ============================================
-- Fix Touchpoints Schema & RLS
-- ============================================

-- 1. Create table if it doesn't exist (basic structure based on code)
CREATE TABLE IF NOT EXISTS touchpoints (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
    type text,
    summary text,
    user_id uuid REFERENCES auth.users(id)
);

-- 2. Add user_id if it was missing from existing table
ALTER TABLE touchpoints 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 3. Enable RLS
ALTER TABLE touchpoints ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read for owners" ON touchpoints;
DROP POLICY IF EXISTS "Enable insert for owners" ON touchpoints;
DROP POLICY IF EXISTS "Enable update for owners" ON touchpoints;
DROP POLICY IF EXISTS "Enable delete for owners" ON touchpoints;

-- 5. Create Policies
CREATE POLICY "Enable read for owners" ON touchpoints
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for owners" ON touchpoints
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for owners" ON touchpoints
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for owners" ON touchpoints
    FOR DELETE USING (auth.uid() = user_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
