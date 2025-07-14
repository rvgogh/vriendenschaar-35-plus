
-- Voeg een user_id kolom toe aan de players tabel om accounts te koppelen
ALTER TABLE public.players ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Maak een index voor betere performance
CREATE INDEX idx_players_user_id ON public.players(user_id);

-- Update RLS policies voor players tabel om gebruikers hun eigen gekoppelde speler te laten zien
DROP POLICY IF EXISTS "Allow public read access to players" ON public.players;

CREATE POLICY "Allow public read access to players" 
ON public.players 
FOR SELECT 
USING (true);

CREATE POLICY "Allow users to update their own player profile" 
ON public.players 
FOR UPDATE 
USING (auth.uid() = user_id);
