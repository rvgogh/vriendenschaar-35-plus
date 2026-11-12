-- Training-module, stap 4: voorkeursposities op volgorde, niveau in drie groepen,
-- en spelers stellen hun eigen voorkeursposities in.
-- Raakt alleen de tabellen van de training-module (player_training_info, player_levels). Herhaalbaar.

-- 1. Posities: een lijst op volgorde in plaats van één positie.
--    K = keeper, V = verdediger, MM = mid-mid, VL = vleugel, S = spits (opstelling 1-2-3-1).
ALTER TABLE public.player_training_info ADD COLUMN IF NOT EXISTS positions text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.player_training_info DROP CONSTRAINT IF EXISTS player_training_info_positions_check;
ALTER TABLE public.player_training_info ADD CONSTRAINT player_training_info_positions_check
  CHECK (positions <@ ARRAY['K', 'V', 'MM', 'VL', 'S']::text[] AND cardinality(positions) <= 5);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'player_training_info' AND column_name = 'position') THEN
    UPDATE public.player_training_info
    SET positions = ARRAY[CASE position WHEN 'K' THEN 'K' WHEN 'V' THEN 'V' WHEN 'M' THEN 'MM' ELSE 'S' END]
    WHERE position IS NOT NULL AND positions = '{}';
    ALTER TABLE public.player_training_info DROP COLUMN position;
  END IF;
END $$;

-- 2. Niveau: Rookie, Eeuwig talent of GOAT. Geen rij betekent Eeuwig talent.
--    Eerder ingevulde niveaus 1–5: 1–2 = Rookie, 3 = Eeuwig talent, 4–5 = GOAT.
ALTER TABLE public.player_levels ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'talent';
ALTER TABLE public.player_levels DROP CONSTRAINT IF EXISTS player_levels_tier_check;
ALTER TABLE public.player_levels ADD CONSTRAINT player_levels_tier_check CHECK (tier IN ('rookie', 'talent', 'goat'));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'player_levels' AND column_name = 'level') THEN
    UPDATE public.player_levels
    SET tier = CASE WHEN level <= 2 THEN 'rookie' WHEN level >= 4 THEN 'goat' ELSE 'talent' END;
    ALTER TABLE public.player_levels DROP COLUMN level;
  END IF;
END $$;

-- 3. Een speler zet zijn eigen voorkeursposities. Alleen de posities: team en niveau blijven bij de trainer.
CREATE OR REPLACE FUNCTION public.set_my_positions(_positions text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _player_id integer;
  _knvb boolean;
  _clean text[] := COALESCE(_positions, '{}');
BEGIN
  SELECT id, knvb_member INTO _player_id, _knvb FROM public.players WHERE auth.uid() IS NOT NULL AND user_id = auth.uid();
  IF _player_id IS NULL THEN
    RAISE EXCEPTION 'Er is geen speler gekoppeld aan jouw account';
  END IF;
  IF cardinality(_clean) <> (SELECT count(DISTINCT p) FROM unnest(_clean) AS p) THEN
    RAISE EXCEPTION 'Elke positie mag maar één keer voorkomen';
  END IF;
  INSERT INTO public.player_training_info (player_id, team, positions)
  VALUES (_player_id, CASE WHEN _knvb THEN 1 ELSE 2 END, _clean)
  ON CONFLICT (player_id) DO UPDATE SET positions = EXCLUDED.positions, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.set_my_positions(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_positions(text[]) TO authenticated;
