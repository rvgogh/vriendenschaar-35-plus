
-- Add a match_date column to store when matches are played
ALTER TABLE public.matches 
ADD COLUMN match_date TIMESTAMP WITH TIME ZONE;

-- Update the existing matches with their dates
UPDATE public.matches 
SET match_date = '2025-06-20 19:00:00+02:00'
WHERE opponent = 'Gecu cup avond 4, datum vrijdag 20 juni';

UPDATE public.matches 
SET match_date = '2025-06-27 19:00:00+02:00'
WHERE opponent = 'Gecu cup avond 5, vrijdag 27 juni';

-- Clean up the opponent names to remove the date information
UPDATE public.matches 
SET opponent = 'Gecu cup avond 4'
WHERE opponent = 'Gecu cup avond 4, datum vrijdag 20 juni';

UPDATE public.matches 
SET opponent = 'Gecu cup avond 5'
WHERE opponent = 'Gecu cup avond 5, vrijdag 27 juni';
