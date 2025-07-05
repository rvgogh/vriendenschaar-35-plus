
-- Create a table for events
CREATE TABLE public.events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  event_date DATE,
  event_time TIME,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enum for event attendance status
CREATE TYPE public.event_attendance_status AS ENUM ('YES', 'NO', 'MAYBE', 'UNKNOWN');

-- Create a table for event attendance statuses
CREATE TABLE public.event_statuses (
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES public.players(id) ON DELETE CASCADE,
  status event_attendance_status NOT NULL DEFAULT 'UNKNOWN',
  PRIMARY KEY (event_id, player_id)
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_statuses ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (same as matches and trainings)
CREATE POLICY "Allow public read access to events" 
  ON public.events 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow all access for all users on event_statuses" 
  ON public.event_statuses 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Insert the first event
INSERT INTO public.events (title, subtitle, event_date, event_time, location, description)
VALUES (
  'Het Grote Seizoensvoorbereidingsbijeenkomstfeest',
  'voor lichaam en geest en de alcoholverslaving',
  '2025-09-06',
  '17:00',
  'Prins Bernhardstraat 86 Culemborg',
  'Iedereen weet: wedstrijden worden gewonnen in de voorbereiding.
Daartoe organiseer ik op zaterdag 6 september, vanaf 17 uur, een seizoensvoorbereidingsbijeenkomstfeest voor Vriendenschaar 35+.
Er zal gewerkt worden aan lichaam en geest en aan het aanwakkeren of in stand houden van de alcoholverslaving. De accommodatie (Prins Bernhardstraat 86) biedt in de voortuin mogelijkheden tot wedstrijdjes balhooghouden en kegelknallen [verder uitwerken].
Binnenshuis worden beelden vertoond van het EK 1988, opdat we ons ALLEMAAL Europees Kampioen kunnen noemen, ook de onfortuinlijken die na 25 juni 1988 zijn geboren. Iedereen gelijk! Iedereen kampioen! Daarnaast liggen er op de tafels diverse voetbalboeken, ter inspiratie.
In de achtertuin vindt de derde helft plaats. Daar mag eventueel ook begonnen worden, wegens de aanwezigheid van bier en wijn en Berryschotels en friet. Heel misschien is er ook sla ofzo, of een verdwaalde tomaat. Maar zeker niet al te veel, dus komt allen!'
);
