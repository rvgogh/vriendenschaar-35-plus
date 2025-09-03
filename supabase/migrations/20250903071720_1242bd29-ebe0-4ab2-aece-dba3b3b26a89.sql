-- Update player access policy to allow public read access to player names
-- as requested by the user

-- Drop the restrictive authenticated-only policy
DROP POLICY IF EXISTS "Allow authenticated users to read players" ON public.players;

-- Restore public read access to players table
-- Player names are intended to be publicly readable per user requirements
CREATE POLICY "Allow public read access to players" 
ON public.players 
FOR SELECT 
USING (true);

-- Keep existing update policies as they are already properly restricted