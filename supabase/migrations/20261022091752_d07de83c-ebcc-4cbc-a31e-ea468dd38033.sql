CREATE TABLE public.bar_duties (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 duty_date date NOT NULL UNIQUE,
 season_id integer REFERENCES public.seasons(id),
 player_one_id integer NOT NULL REFERENCES public.players(id),
 player_two_id integer NOT NULL REFERENCES public.players(id),
 knvb_only boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bar_duties TO authenticated;
GRANT ALL ON public.bar_duties TO service_role;
ALTER TABLE public.bar_duties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read bar duties" ON public.bar_duties FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Superusers manage bar duties" ON public.bar_duties FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superuser'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'superuser'::public.app_role));
CREATE OR REPLACE FUNCTION public.validate_bar_duty() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 IF extract(isodow FROM NEW.duty_date) <> 3 THEN RAISE EXCEPTION 'Een bardienst moet op woensdag vallen'; END IF;
 IF NEW.player_one_id = NEW.player_two_id THEN RAISE EXCEPTION 'Kies twee verschillende spelers'; END IF;
 IF NEW.knvb_only AND (SELECT count(*) FROM public.players WHERE id IN (NEW.player_one_id, NEW.player_two_id) AND knvb_member) <> 2 THEN RAISE EXCEPTION 'Deze ronde is alleen voor KNVB-spelers'; END IF;
 SELECT id INTO NEW.season_id FROM public.seasons WHERE NEW.duty_date BETWEEN start_date AND end_date ORDER BY start_date DESC LIMIT 1;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_bar_duty() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER validate_bar_duty BEFORE INSERT OR UPDATE ON public.bar_duties FOR EACH ROW EXECUTE FUNCTION public.validate_bar_duty();
CREATE TRIGGER update_bar_duties_timestamp BEFORE UPDATE ON public.bar_duties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();