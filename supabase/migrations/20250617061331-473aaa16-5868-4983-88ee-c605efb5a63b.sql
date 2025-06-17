
-- Remove all existing matches and their related player statuses
DELETE FROM public.player_statuses;
DELETE FROM public.matches;

-- Add the two new Gecu cup matches with their dates
INSERT INTO public.matches (opponent, match_date) VALUES 
('Gecu cup avond 4', '2025-06-20 19:00:00+02:00'),
('Gecu cup avond 5', '2025-06-27 19:00:00+02:00');
