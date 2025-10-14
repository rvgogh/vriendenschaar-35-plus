-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for key holder
CREATE TABLE public.key_holder (
  id integer PRIMARY KEY DEFAULT 1,
  player_id integer NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.key_holder ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view who has the key
CREATE POLICY "Authenticated users can view key holder"
ON public.key_holder
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update who has the key
CREATE POLICY "Authenticated users can update key holder"
ON public.key_holder
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (id = 1);

-- Allow authenticated users to insert initial key holder
CREATE POLICY "Authenticated users can insert key holder"
ON public.key_holder
FOR INSERT
TO authenticated
WITH CHECK (id = 1);

-- Create trigger to update timestamp
CREATE TRIGGER update_key_holder_updated_at
BEFORE UPDATE ON public.key_holder
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial row (you can change this to any player_id)
INSERT INTO public.key_holder (id, player_id) VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;