ALTER TABLE public.matches ADD COLUMN status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','played','cancelled'));
UPDATE public.matches SET status = 'played' WHERE match_date < date_trunc('day', now());
UPDATE public.matches SET status = 'cancelled' WHERE match_date::date = DATE '2026-11-27';