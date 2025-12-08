-- Create table for training location (single fixed location)
CREATE TABLE public.training_location (
  id integer PRIMARY KEY DEFAULT 1,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_meters integer NOT NULL DEFAULT 100,
  name text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_location CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.training_location ENABLE ROW LEVEL SECURITY;

-- Everyone can read the training location
CREATE POLICY "Anyone can view training location"
ON public.training_location FOR SELECT
USING (true);

-- Only superusers can modify
CREATE POLICY "Superusers can update training location"
ON public.training_location FOR UPDATE
USING (has_role(auth.uid(), 'superuser'::app_role));

CREATE POLICY "Superusers can insert training location"
ON public.training_location FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superuser'::app_role));

-- Add verified field to training_statuses
ALTER TABLE public.training_statuses 
ADD COLUMN verified_at timestamp with time zone,
ADD COLUMN verified_latitude double precision,
ADD COLUMN verified_longitude double precision;

-- Insert default training location (you can update this later)
INSERT INTO training_location (id, latitude, longitude, radius_meters, name)
VALUES (1, 52.0907, 5.1214, 150, 'Trainingslocatie');