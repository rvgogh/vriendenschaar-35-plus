-- Create seasons table
CREATE TABLE public.seasons (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on seasons
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Allow public read access to seasons
CREATE POLICY "Allow public read access to seasons" 
ON public.seasons 
FOR SELECT 
USING (true);

-- Add season_id to trainings table
ALTER TABLE public.trainings 
ADD COLUMN season_id integer REFERENCES public.seasons(id);

-- Add season_id to matches table
ALTER TABLE public.matches 
ADD COLUMN season_id integer REFERENCES public.seasons(id);

-- Insert the two seasons
INSERT INTO public.seasons (name, start_date, end_date) VALUES
  ('Najaars competitie', '2025-08-19', '2025-12-01'),
  ('Voorjaars competitie', '2026-03-01', '2026-06-01');

-- Update existing trainings to link them to seasons
UPDATE public.trainings
SET season_id = (
  SELECT id FROM public.seasons
  WHERE trainings.training_at::date >= seasons.start_date
    AND trainings.training_at::date <= seasons.end_date
  LIMIT 1
);

-- Update existing matches to link them to seasons
UPDATE public.matches
SET season_id = (
  SELECT id FROM public.seasons
  WHERE matches.match_date::date >= seasons.start_date
    AND matches.match_date::date <= seasons.end_date
  LIMIT 1
);

-- Create trigger for updated_at on seasons
CREATE TRIGGER update_seasons_updated_at
BEFORE UPDATE ON public.seasons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();