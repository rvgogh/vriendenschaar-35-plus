-- Training-module 2/3: tabellen, rechten en functies.
-- Bestaande tabellen worden niet gewijzigd. Het script mag veilig opnieuw gedraaid worden.

-- Trainer of beheerder? (tekstvergelijking, zodat dit ook werkt direct na het toevoegen van de enumwaarde)
CREATE OR REPLACE FUNCTION public.is_trainer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text IN ('trainer', 'superuser')
  )
$$;
REVOKE ALL ON FUNCTION public.is_trainer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_trainer(uuid) TO authenticated;

-- Oefeningen
CREATE TABLE IF NOT EXISTS public.drills (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('warming-up', 'passen', 'afwerken', 'tactisch', 'partijvorm', 'conditie')),
  duration integer NOT NULL,
  min_players integer NOT NULL,
  max_players integer NOT NULL,
  tactical boolean NOT NULL DEFAULT false,
  fixed boolean NOT NULL DEFAULT false,
  material text,
  explanation text NOT NULL,
  coaching_points text[] NOT NULL DEFAULT '{}',
  variants jsonb NOT NULL DEFAULT '{}'::jsonb,
  sketch text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Team (1 of 2) en positie per speler: leesbaar voor alle leden
CREATE TABLE IF NOT EXISTS public.player_training_info (
  player_id integer PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  team smallint NOT NULL CHECK (team IN (1, 2)),
  position text CHECK (position IN ('K', 'V', 'M', 'A')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Niveau per speler: alleen voor trainers
CREATE TABLE IF NOT EXISTS public.player_levels (
  player_id integer PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Eén trainingsplan per trainingsavond
CREATE TABLE IF NOT EXISTS public.training_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id integer NOT NULL UNIQUE REFERENCES public.trainings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'concept' CHECK (status IN ('concept', 'published')),
  theme text,
  player_count integer,
  teams_shared boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_plan_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  position integer NOT NULL,
  drill_id text NOT NULL REFERENCES public.drills(id),
  minutes integer NOT NULL,
  UNIQUE (plan_id, position)
);

-- Indeling voor de afsluitende partij: veld 1 of 2, hesjes / zonder / extra speler
CREATE TABLE IF NOT EXISTS public.training_team_assignments (
  plan_id uuid NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  player_id integer NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  field smallint NOT NULL CHECK (field IN (1, 2)),
  side text NOT NULL CHECK (side IN ('hesjes', 'zonder', 'extra')),
  PRIMARY KEY (plan_id, player_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drills, public.player_training_info, public.player_levels,
  public.training_plans, public.training_plan_blocks, public.training_team_assignments TO authenticated;
GRANT ALL ON public.drills, public.player_training_info, public.player_levels,
  public.training_plans, public.training_plan_blocks, public.training_team_assignments TO service_role;

ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_training_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plan_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_team_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read drills" ON public.drills;
CREATE POLICY "Members can read drills" ON public.drills FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Trainers manage drills" ON public.drills;
CREATE POLICY "Trainers manage drills" ON public.drills FOR ALL TO authenticated
  USING (public.is_trainer(auth.uid())) WITH CHECK (public.is_trainer(auth.uid()));

DROP POLICY IF EXISTS "Members can read player training info" ON public.player_training_info;
CREATE POLICY "Members can read player training info" ON public.player_training_info FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Trainers manage player training info" ON public.player_training_info;
CREATE POLICY "Trainers manage player training info" ON public.player_training_info FOR ALL TO authenticated
  USING (public.is_trainer(auth.uid())) WITH CHECK (public.is_trainer(auth.uid()));

DROP POLICY IF EXISTS "Trainers manage player levels" ON public.player_levels;
CREATE POLICY "Trainers manage player levels" ON public.player_levels FOR ALL TO authenticated
  USING (public.is_trainer(auth.uid())) WITH CHECK (public.is_trainer(auth.uid()));

DROP POLICY IF EXISTS "Members read published plans" ON public.training_plans;
CREATE POLICY "Members read published plans" ON public.training_plans FOR SELECT TO authenticated
  USING (status = 'published' OR public.is_trainer(auth.uid()));
DROP POLICY IF EXISTS "Trainers manage plans" ON public.training_plans;
CREATE POLICY "Trainers manage plans" ON public.training_plans FOR ALL TO authenticated
  USING (public.is_trainer(auth.uid())) WITH CHECK (public.is_trainer(auth.uid()));

DROP POLICY IF EXISTS "Members read blocks of published plans" ON public.training_plan_blocks;
CREATE POLICY "Members read blocks of published plans" ON public.training_plan_blocks FOR SELECT TO authenticated
  USING (public.is_trainer(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.training_plans p WHERE p.id = plan_id AND p.status = 'published'));
DROP POLICY IF EXISTS "Trainers manage blocks" ON public.training_plan_blocks;
CREATE POLICY "Trainers manage blocks" ON public.training_plan_blocks FOR ALL TO authenticated
  USING (public.is_trainer(auth.uid())) WITH CHECK (public.is_trainer(auth.uid()));

DROP POLICY IF EXISTS "Members read shared teams" ON public.training_team_assignments;
CREATE POLICY "Members read shared teams" ON public.training_team_assignments FOR SELECT TO authenticated
  USING (public.is_trainer(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.training_plans p WHERE p.id = plan_id AND p.status = 'published' AND p.teams_shared));
DROP POLICY IF EXISTS "Trainers manage teams" ON public.training_team_assignments;
CREATE POLICY "Trainers manage teams" ON public.training_team_assignments FOR ALL TO authenticated
  USING (public.is_trainer(auth.uid())) WITH CHECK (public.is_trainer(auth.uid()));

DROP TRIGGER IF EXISTS update_training_plans_timestamp ON public.training_plans;
CREATE TRIGGER update_training_plans_timestamp BEFORE UPDATE ON public.training_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Startindeling: KNVB-lid = Team 1, de rest Team 2. Bestaande rijen blijven staan.
INSERT INTO public.player_training_info (player_id, team)
SELECT id, CASE WHEN knvb_member THEN 1 ELSE 2 END FROM public.players
ON CONFLICT (player_id) DO NOTHING;

-- Beheerder zet de trainersrol aan of uit voor een speler met een gekoppeld account.
-- Een gebruiker houdt één rij in user_roles; beheerders blijven beheerder.
CREATE OR REPLACE FUNCTION public.admin_set_trainer(_player_id integer, _enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superuser'::public.app_role) THEN
    RAISE EXCEPTION 'Alleen beheerders mogen trainers aanwijzen';
  END IF;
  SELECT user_id INTO _uid FROM public.players WHERE id = _player_id;
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Deze speler heeft nog geen gekoppeld account';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role::text = 'superuser') THEN
    RETURN;
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _uid;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, (CASE WHEN _enabled THEN 'trainer' ELSE 'user' END)::public.app_role);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_trainer(integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_trainer(integer, boolean) TO authenticated;

-- Welke spelers zijn trainer of beheerder? Alleen voor beheerders.
CREATE OR REPLACE FUNCTION public.admin_list_trainer_player_ids()
RETURNS TABLE (player_id integer, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, r.role::text
  FROM public.players p
  JOIN public.user_roles r ON r.user_id = p.user_id
  WHERE public.has_role(auth.uid(), 'superuser'::public.app_role)
    AND r.role::text IN ('trainer', 'superuser')
$$;
REVOKE ALL ON FUNCTION public.admin_list_trainer_player_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_trainer_player_ids() TO authenticated;
