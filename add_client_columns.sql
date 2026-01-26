-- ============================================
-- Add Missing Columns to Clients
-- ============================================

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS last_contacted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_followup_at timestamp with time zone;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
