SELECT setval(pg_get_serial_sequence('public.players','id'), COALESCE((SELECT MAX(id) FROM public.players), 1));
INSERT INTO public.players (name, knvb_member) VALUES ('Raoul', false);