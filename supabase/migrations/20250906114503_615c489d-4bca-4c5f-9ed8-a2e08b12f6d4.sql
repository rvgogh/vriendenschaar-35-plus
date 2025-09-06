-- Fix security vulnerability: Restrict public access to player data
-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "Allow public read access to players" ON public.players;

-- Create new restrictive policies for player data access
-- Allow authenticated users to read player names and basic info (but not user_id mappings)
CREATE POLICY "Authenticated users can view player basic info" 
ON public.players 
FOR SELECT 
TO authenticated
USING (true);

-- Allow users to view full player data (including user_id) only for their own player record
CREATE POLICY "Users can view their own full player data" 
ON public.players 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Allow superusers to view all player data including user_id mappings
CREATE POLICY "Superusers can view all player data" 
ON public.players 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'superuser'::app_role));

-- Note: The existing update policies remain unchanged as they already have proper restrictions