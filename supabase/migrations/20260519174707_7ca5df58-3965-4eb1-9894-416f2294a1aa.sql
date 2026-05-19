
-- May 29: rename and remove non-KNVB statuses
UPDATE public.matches SET opponent = 'Vriendenschaar' WHERE id = 25;
DELETE FROM public.player_statuses
 WHERE match_id = 25
   AND player_id IN (SELECT id FROM public.players WHERE knvb_member = false);

-- June 5: cancel
DELETE FROM public.player_statuses WHERE match_id = 22;
DELETE FROM public.matches WHERE id = 22;

-- June 19 -> June 20
UPDATE public.matches SET match_date = '2026-06-19 22:00:00+00', opponent = 'Gecu cup avond 5' WHERE id = 24;
DELETE FROM public.player_statuses WHERE match_id = 24;
