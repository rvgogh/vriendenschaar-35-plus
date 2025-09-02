-- Add KNVB membership column to players table
ALTER TABLE public.players 
ADD COLUMN knvb_member BOOLEAN NOT NULL DEFAULT false;

-- Update the specified players as KNVB members
UPDATE public.players 
SET knvb_member = true 
WHERE LOWER(name) IN (
  'maikel', 'isidoor', 'dieter', 'geurt', 'robin', 'teun', 'roland', 
  'luuk', 'william', 'ivo', 'niek', 'sjors', 'thomas', 'martijn', 
  'joop', 'jan jaap', 'ronnie', 'max', 'lars'
);

-- Create index for better performance when filtering by KNVB membership
CREATE INDEX idx_players_knvb_member ON public.players(knvb_member);