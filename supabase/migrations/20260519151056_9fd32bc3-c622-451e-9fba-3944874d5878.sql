
-- 1. Create the new merged match
INSERT INTO public.matches (id, opponent, match_date, start_time, arrival_time, season_id)
VALUES (25, 'Vriendenschaar / Gecu cup avond 2', '2026-05-28 22:00:00+00', '19:00:00', '18:30:00', 2);

-- 2. Merge player_statuses from matches 19 and 21 into 25 with priority IN > MAYBE > OUT
INSERT INTO public.player_statuses (match_id, player_id, status)
SELECT 25, player_id,
  CASE
    WHEN bool_or(status = 'IN') THEN 'IN'::player_status
    WHEN bool_or(status = 'MAYBE') THEN 'MAYBE'::player_status
    WHEN bool_or(status = 'OUT') THEN 'OUT'::player_status
  END
FROM public.player_statuses
WHERE match_id IN (19, 21)
GROUP BY player_id;

-- 3. Delete old statuses and matches
DELETE FROM public.player_statuses WHERE match_id IN (19, 21);
DELETE FROM public.matches WHERE id IN (19, 21);
