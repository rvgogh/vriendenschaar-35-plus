ALTER TABLE public.player_levels DROP CONSTRAINT player_levels_tier_check;
ALTER TABLE public.player_levels ADD CONSTRAINT player_levels_tier_check CHECK (tier IN ('rookie', 'decent', 'talent', 'goat'));

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
  IF _tier IS NULL OR _tier NOT IN ('rookie', 'decent', 'talent', 'goat') THEN
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