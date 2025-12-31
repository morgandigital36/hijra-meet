-- Fix RLS policies for anonymous users to update and delete events
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anonymous hosts can update their events via identifier" ON events;
DROP POLICY IF EXISTS "Anonymous hosts can delete their events via identifier" ON events;
DROP POLICY IF EXISTS "Host can update their events" ON events;
DROP POLICY IF EXISTS "Host can delete their events" ON events;

-- Create permissive policies for anonymous users
-- Ownership is verified in the application layer

CREATE POLICY "Allow anonymous updates"
    ON events
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous deletes"
    ON events
    FOR DELETE
    TO anon
    USING (true);

-- Verify policies
SELECT policyname, cmd, permissive, roles
FROM pg_policies 
WHERE tablename = 'events';
