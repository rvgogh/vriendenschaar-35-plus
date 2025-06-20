
-- Add two new time fields to the matches table
ALTER TABLE public.matches 
ADD COLUMN start_time TIME,
ADD COLUMN arrival_time TIME;

-- Update the existing matches with the requested times
UPDATE public.matches 
SET start_time = '20:00:00',
    arrival_time = '19:30:00'
WHERE match_date IS NOT NULL;
