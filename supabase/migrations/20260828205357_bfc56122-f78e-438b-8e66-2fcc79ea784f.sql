UPDATE public.matches
SET match_date = '2027-05-21T17:30:00+00:00'
WHERE opponent = 'Voetbal avond 5'
  AND season_id = (
    SELECT id FROM public.seasons WHERE name = 'Voorjaar competitie ''27'
  );