
-- Update existing player names to use first names only
UPDATE public.players SET name = 'Maikel' WHERE name = 'Maikel Aragon van den Broeke';
UPDATE public.players SET name = 'Isidoor' WHERE name = 'Isidoor van den Berk';
UPDATE public.players SET name = 'Dieter' WHERE name = 'Dieter van den Broeck';
UPDATE public.players SET name = 'Geurt' WHERE name = 'Geurt van den Broek';
UPDATE public.players SET name = 'Robin' WHERE name = 'Robin Caerteling';
UPDATE public.players SET name = 'Teun' WHERE name = 'Teun Fransen';
UPDATE public.players SET name = 'Roland' WHERE name = 'Roland van Gogh';
UPDATE public.players SET name = 'Luuk' WHERE name = 'Luuk van Hees';
UPDATE public.players SET name = 'William' WHERE name = 'William van Heteren';
UPDATE public.players SET name = 'Ivo' WHERE name = 'Ivo van der Hout';
UPDATE public.players SET name = 'Niek' WHERE name = 'Niek Loman';
UPDATE public.players SET name = 'Sjors' WHERE name = 'Sjors Overman';
UPDATE public.players SET name = 'Thomas' WHERE name = 'Thomas Pels';
UPDATE public.players SET name = 'Martijn' WHERE name = 'Martijn Schakel';
UPDATE public.players SET name = 'Joop' WHERE name = 'Joop Schell';
UPDATE public.players SET name = 'JanJaap' WHERE name = 'JanJaap Schep';
UPDATE public.players SET name = 'Ronnie' WHERE name = 'Ronnie van Veen';
UPDATE public.players SET name = 'Max' WHERE name = 'Max Visser';
UPDATE public.players SET name = 'Lars' WHERE name = 'Lars Wierenga';

-- Remove Arthur from the players list
DELETE FROM public.players WHERE name = 'Arthur van Westerop';

-- Add the new players
INSERT INTO public.players (name) VALUES ('Daniël'), ('Geert'), ('Wouter'), ('Gert-Jan');
