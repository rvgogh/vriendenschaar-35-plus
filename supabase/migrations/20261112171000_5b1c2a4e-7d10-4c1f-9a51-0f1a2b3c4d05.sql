-- Training-module, stap 5: een speler stelt ook zijn eigen niveau in.
-- Andermans niveau blijft alleen zichtbaar voor trainers. Herhaalbaar. Vereist stap 4.

-- Eigen niveau lezen. Zonder rij = Eeuwig talent.
CREATE OR REPLACE FUNCTION public.get_my_level()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT l.tier FROM public.player_levels l
     JOIN public.players p ON p.id = l.player_id
     WHERE auth.uid() IS NOT NULL AND p.user_id = auth.uid()),
    'talent')
$$;
REVOKE ALL ON FUNCTION public.get_my_level() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_level() TO authenticated;

-- Eigen niveau zetten: rookie, talent of goat. Eeuwig talent is de standaard en heeft geen rij nodig.
CREATE OR REPLACE FUNCTION public.set_my_level(_tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _player_id integer;
BEGIN
  SELECT id INTO _player_id FROM public.players WHERE auth.uid() IS NOT NULL AND user_id = auth.uid();
  IF _player_id IS NULL THEN
    RAISE EXCEPTION 'Er is geen speler gekoppeld aan jouw account';
  END IF;
  IF _tier IS NULL OR _tier NOT IN ('rookie', 'talent', 'goat') THEN
    RAISE EXCEPTION 'Onbekend niveau';
  END IF;
  IF _tier = 'talent' THEN
    DELETE FROM public.player_levels WHERE player_id = _player_id;
  ELSE
    INSERT INTO public.player_levels (player_id, tier) VALUES (_player_id, _tier)
    ON CONFLICT (player_id) DO UPDATE SET tier = EXCLUDED.tier, updated_at = now();
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_my_level(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_level(text) TO authenticated;
