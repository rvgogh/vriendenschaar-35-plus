ALTER TABLE public.events ADD COLUMN IF NOT EXISTS season_id integer REFERENCES public.seasons(id);

UPDATE public.events e
SET season_id = s.id
FROM public.seasons s
WHERE e.event_date IS NOT NULL
  AND e.event_date BETWEEN s.start_date AND s.end_date;

CREATE OR REPLACE FUNCTION public.set_event_season()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_date IS NOT NULL THEN
    SELECT s.id INTO NEW.season_id
    FROM public.seasons s
    WHERE NEW.event_date BETWEEN s.start_date AND s.end_date
    LIMIT 1;
  ELSE
    NEW.season_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_set_season ON public.events;
CREATE TRIGGER events_set_season
BEFORE INSERT OR UPDATE OF event_date ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_event_season();