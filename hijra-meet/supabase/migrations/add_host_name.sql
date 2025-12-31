-- Migration: Add host_name column to events table
-- Run this migration in your Supabase SQL Editor

-- Add host_name column to store host display name
ALTER TABLE events ADD COLUMN IF NOT EXISTS host_name TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_events_host_id ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Update status enum to include 'deleted' if it doesn't exist
-- Note: If status is a text column, no change needed
-- If it's an enum, you may need to add the 'deleted' value

-- RLS policies update
-- Allow hosts to delete their own events
CREATE POLICY IF NOT EXISTS "hosts_can_update_own_events"
    ON events
    FOR UPDATE
    USING (host_id = current_setting('app.host_id', true)::text OR host_id IS NULL)
    WITH CHECK (host_id = current_setting('app.host_id', true)::text OR host_id IS NULL);

-- Comments for documentation
COMMENT ON COLUMN events.host_name IS 'Display name of the host';
COMMENT ON COLUMN events.host_id IS 'Unique identifier for the host, stored in client localStorage';
