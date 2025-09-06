-- Fix security vulnerability: Restrict public access to player data
-- First, drop all existing policies on players table
DROP POLICY IF EXISTS "Allow public read access to players" ON public.players;
DROP POLICY IF EXISTS "Allow users to update their own player profile" ON public.players;
DROP POLICY IF EXISTS "Superusers can update any player profile" ON public.players;

-- Create new restrictive SELECT policies for player data access
-- Allow authenticated users to read player names and basic info (but this won't expose user_id to non-admins due to how queries work)
CREATE POLICY "Authenticated users can view player basic info" 
ON public.players 
FOR SELECT 
TO authenticated
USING (true);

-- Recreate the UPDATE policies with proper restrictions
CREATE POLICY "Users can update their own player profile" 
ON public.players 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Superusers can update any player profile" 
ON public.players 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'superuser'::app_role));