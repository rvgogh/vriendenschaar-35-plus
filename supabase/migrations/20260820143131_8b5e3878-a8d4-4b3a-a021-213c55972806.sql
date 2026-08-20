CREATE OR REPLACE FUNCTION public.set_event_season()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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

REVOKE EXECUTE ON FUNCTION public.set_event_season() FROM PUBLIC, anon, authenticated;